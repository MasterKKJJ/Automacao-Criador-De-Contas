const { connect } = require("puppeteer-real-browser");

(async () => {
  let browser, page;
  try {
    // Conecta ao navegador com as configurações desejadas
    ({ browser, page } = await connect({
      args: [],
      headless: false, // Deixa o navegador visível
      connectOption: { defaultViewport: null }
    }));

    // Substitua pela URL do seu endpoint
    const endpoint = "https://temp-mail.org/pt/";
    await page.goto(endpoint, { waitUntil: "networkidle2" });

    const containerSelector =
      "#tm-body > main > div:nth-child(1) > div > div.col-sm-12.col-md-12.col-lg-12.col-xl-8 > div.tm-content > div > div.inboxWarpMain > div > div.inbox-dataList";
    await page.waitForSelector(containerSelector);

    // Função para extrair os itens da lista

    const openedLinks = new Set(); // Conjunto para registrar links já abertos

    setInterval(async () => {
      // Extrai os links de cada item, ignorando o primeiro <li> (cabeçalho "Assunto")
      const links = await page.evaluate(containerSel => {
        const container = document.querySelector(containerSel);
        if (!container) return [];
        const items = container.querySelectorAll("ul > li");
        let result = [];
        // Inicia em 1 para pular o cabeçalho
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

            // Define as palavras-chave para procurar
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

            // Função auxiliar para obter o texto de um elemento em minúsculas
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

          if (await verifyHref) {
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

    // O navegador permanecerá aberto para continuar a leitura.
    // Você pode adicionar outras funcionalidades ou encerrar manualmente quando necessário.
  } catch (error) {
    console.error("Erro na execução:", error);
    if (browser) {
    }
  }
})();
