const { connect } = require("puppeteer-real-browser");

async function CriarEmail() {
  let browser, page;
  try {
    // Conecta ao navegador com as configurações desejadas
    ({ browser, page } = await connect({
      args: [],
      headless: false, // Deixa o navegador visível
      connectOption: { defaultViewport: null }
    }));

    // Define o endpoint do temp-mail e navega até ele
    const endpoint = "https://temp-mail.org/pt/";
    await page.goto(endpoint, { waitUntil: "networkidle2" });

    // Aguarda 6 segundos para o site carregar
    console.log("Aguarde 10 segundos");
    await new Promise(r => setTimeout(r, 10000));

    // Extrai o email exibido na página (pode ser .value ou .innerText, dependendo do elemento)
    const email = await page.evaluate(() => {
      const mailEl = document.querySelector("#mail");
      return mailEl ? mailEl.value || mailEl.innerText : null;
    });

    console.log("Email gerado:", email);

    // Inicia o monitoramento dos emails recebidos (o container de emails)
    const containerSelector =
      "#tm-body > main > div:nth-child(1) > div > div.col-sm-12.col-md-12.col-lg-12.col-xl-8 > div.tm-content > div > div.inboxWarpMain > div > div.inbox-dataList";
    await page.waitForSelector(containerSelector);

    // Conjunto para registrar links já processados (para evitar duplicidade)
    const openedLinks = new Set();

    // Inicia a verificação periódica (a cada 5 segundos)
    setInterval(async () => {
      // Extrai os links de cada item da lista, ignorando o cabeçalho (primeiro <li>)
      const links = await page.evaluate(containerSel => {
        const container = document.querySelector(containerSel);
        if (!container) return [];
        const items = container.querySelectorAll("ul > li");
        let result = [];
        // Inicia em 1 para pular o cabeçalho "Assunto"
        for (let i = 1; i < items.length; i++) {
          const li = items[i];
          const anchor = li.querySelector(
            "div.col-box.hidden-xs-sm > span > a"
          );
          if (anchor && anchor.href) {
            result.push(anchor.href);
          }
        }
        return result;
      }, containerSelector);

      // Para cada link novo (não processado)
      for (const link of links) {
        if (!openedLinks.has(link)) {
          openedLinks.add(link);
          console.log("Processando email:", link);
          // Abre a aba do email
          const emailPage = await browser.newPage();
          await emailPage.goto(link, { waitUntil: "networkidle2" });

          // Procura o link de verificação dentro da aba do email
          const verifyHref = await emailPage.evaluate(async () => {
            // Aguarda um pouco para o conteúdo carregar
            await new Promise(r => setTimeout(r, 2000));

            // Tenta um seletor fixo (caso haja um link com esse seletor)
            let el = document.querySelector(
              "#tm-body > main > div:nth-child(1) > div > div.col-sm-12.col-md-12.col-lg-12.col-xl-8 > div.tm-content > div > div.inboxWarpMain > div > div.inbox-data-content > div.inbox-data-content-intro"
            );
            if (el && (el.href || el.getAttribute("href"))) {
              return el.href || el.getAttribute("href");
            }

            // Define as palavras-chave para procurar (incluindo variações)
            const keywords = [
              "verify",
              "verificar",
              "verificar sua conta",
              "verify my account",
              "verificar seu email",
              "verificar seu endereço de email",
              "ativar conta",
              "ativar email",
              "ativar minha conta",
              "ativar meu email",
              "confirmar conta",
              "confirmar email",
              "confirmar meu email",
              "confirmar minha conta",
              "validar conta",
              "validar email",
              "validar meu email",
              "validar minha conta",
              "checar conta",
              "checar email",
              "checar meu email",
              "checar minha conta",
              "ativação de conta",
              "ativação de email",
              "confirmação de conta",
              "confirmação de email",
              "validação de conta",
              "validação de email",
              "email verification",
              "account verification",
              "verify email address",
              "verify account",
              "activate account",
              "activate email",
              "confirm email address",
              "confirm account",
              "validate email address",
              "validate account",
              "check email address",
              "check account"
            ];

            const getText = element => element.innerText.toLowerCase();

            // Procura entre todos os links (<a>)
            const anchors = Array.from(document.querySelectorAll("a"));
            let found = anchors.find(a =>
              keywords.some(kw => getText(a).includes(kw))
            );
            if (found && (found.href || found.getAttribute("href"))) {
              return found.href || found.getAttribute("href");
            }

            // Procura entre os botões (<button>)
            const buttons = Array.from(document.querySelectorAll("button"));
            found = buttons.find(b =>
              keywords.some(kw => getText(b).includes(kw))
            );
            if (found && (found.href || found.getAttribute("href"))) {
              return found.href || found.getAttribute("href");
            }

            return null;
          });

          if (verifyHref) {
            console.log("Link de verificação encontrado:", verifyHref);
            // Abre a aba de verificação
            const verifyPage = await browser.newPage();
            await verifyPage.goto(verifyHref, { waitUntil: "networkidle2" });
            // Espera 5 segundos
            await new Promise(r => setTimeout(r, 5000));
            // Fecha a aba de verificação
            await verifyPage.close();
          } else {
            console.log(
              "Nenhum link de verificação encontrado para esse email."
            );
          }
          // Fecha a aba do email
          await emailPage.close();
        }
      }
    }, 5000);

    // Retorna o email extraído dentro de um objeto
    return { email };
  } catch (error) {
    console.error("Erro na execução:", error);
  }
}

module.exports = { CriarEmail };
