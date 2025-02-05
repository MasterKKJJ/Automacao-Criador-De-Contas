const readline = require("readline");

function askQuestion(query) {
  return new Promise(resolve => {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });

    rl.question(query, answer => {
      rl.close();
      resolve(answer);
    });
  });
}
// Função auxiliar para extrair o texto de um seletor
async function getElementText(page, selector) {
  return await page.evaluate(sel => {
    const el = document.querySelector(sel);
    return el ? (el.innerText || el.value || "").trim().toLowerCase() : "";
  }, selector);
}

// Função auxiliar para aguardar um determinado tempo
function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function EscreverNosCamposLogin(page, creds) {
  if (
    page.url() !==
    "https://securitytrails.com/app/auth/login?return=/app/account/credentials"
  ) {
    await page.goto(
      "https://securitytrails.com/app/auth/login?return=/app/account/credentials"
    );
  }

  await page.type("#email", creds.email, { delay: 100 });
  await page.type("#password", creds.password, { delay: 100 });
  await page.click("#app-content > div > form > div.mt-6 > button", {
    waitUntil: "networkidle0"
  });
  await delay(2000);
}
async function EscreverNosCamposCadastro(page, browser, creds) {
  const signupUrl =
    "https://securitytrails.com/app/signup?utm_source=st-home&utm_medium=button&utm_campaign=top";

  await page.goto(signupUrl, { waitUntil: "networkidle0" });
  await page.waitForNavigation({ waitUntil: "networkidle2" });
  await delay(6000);

  // Verifica se o formulário esperado está presente
  // Caso o campo "#name" não exista, pode ser que um captcha ou outro elemento esteja no lugar
  const nameExists = await page.$("#name");
  if (!nameExists) {
    // Você pode optar por lançar um erro ou pausar para intervenção manual
    throw new Error(
      "Campo de cadastro não encontrado - possivelmente um captcha está impedindo a visualização."
    );
  }

  // Preenche os campos
  await page.type("#name", creds.user, { delay: 60 });
  await page.type("#company", creds.company, { delay: 100 });
  await page.type("#email", creds.email, { delay: 70 });
  await page.type("#password", creds.password, { delay: 45 });
  await page.click(
    "#app-content > div > div.relative.bg-white.dark\\:bg-black-90.w-full.p-8.grid > div > div > div > form > div:nth-child(6) > div.flex.items-center > div.checkbox > label"
  );
  await delay(1000);

  await page.click(
    "#app-content > div > div.relative.bg-white.dark\\:bg-black-90.w-full.p-8.grid > div > div > div > form > div:nth-child(7) > span > button",
    { waitUntil: "networkidle0" }
  );

  await delay(3000);
  let primeiraTentativa = true;

  async function capturarErro(page) {
    let seletorErro;

    if (primeiraTentativa) {
      seletorErro =
        "#__next > div:nth-child(3) > div > div:nth-child(1) > div > div.flex.place-items-center.flex-grow.py-4.leading-6.font-light.text-white";
      primeiraTentativa = false; // Marca que a primeira tentativa já foi feita
    } else {
      seletorErro =
        "#__next > div:nth-child(3) > div > div:nth-child(2) > div > div.flex.place-items-center.flex-grow.py-4.leading-6.font-light.text-white";
    }

    try {
      await page.waitForSelector(seletorErro, { timeout: 2000 }); // Aguarda o balão aparecer
      const erro = await page.$eval(seletorErro, el =>
        el.innerText.trim().toLowerCase()
      );

      console.log("Erro detectado:", erro);

      return erro;
    } catch (e) {
      console.log("Nenhum erro detectado.");
      return null;
    }
  }

  // Defina o seletor do botão em uma constante para facilitar
  const buttonSelector =
    "#app-content > div > div.relative.bg-white.dark\\:bg-black-90.w-full.p-8.grid > div > div > div > form > div:nth-child(7) > span > button";

  let erro = await capturarErro(page);

  // Loop para tentar corrigir enquanto "erro" for nulo, "invalid recaptcha" ou undefined
  while (
    erro !== "Congratulations! Your account has been created successfully!" &&
    (erro !== null || erro !== undefined || erro !== "invalid recaptcha")
  ) {
    try {
      const newPage = await browser.newPage();
      await newPage.goto("https://google.com", { waitUntil: "networkidle0" });
      await newPage.close();
    } catch (e) {
      console.log("Erro ao abrir nova aba:", e);
    }

    // Aguarda 2 segundos
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Tenta clicar no botão, aguardando que o elemento esteja presente
    console.log("Aqui a url é: " + page.url());
    try {
      // await page.waitForSelector(buttonSelector, { timeout: 5000 });
      console.log("Clicando no botão para tentar novamente...");
      await page.click(buttonSelector, { waitUntil: "networkidle0" });
    } catch (clickError) {
      try {
        if (page.url() === "https://securitytrails.com/app/verify") {
          await page.reload({ waitUntil: "networkidle0" });
          console.log("2 Aqui a url é: " + page.url());
          console.log("Página recarregada por ausência do botão.");
          break;
          // ele vem para cá e depois da um reload e fica abrindo o google novamente
        }
      } catch (reloadError) {
        console.log("Erro ao recarregar a página:", reloadError);
      }
    }
    try {
      erro = await capturarErro(page);
    } catch (e) {
      console.log("Erro ao avaliar o elemento de erro:", e);
      erro = await capturarErro(page);
    }
    console.log(erro);
    // Aguarda 1 segundo antes de reavaliar
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  // console.log("Saiu");
  await new Promise(r => setTimeout(r, 3000));
  await AcessarApi(page);
}

async function AcessarApi(page) {
  const credentialsUrl = "https://securitytrails.com/app/account/credentials";
  while (page.url() !== credentialsUrl) {
    await page.goto(credentialsUrl, { waitUntil: "networkidle0" });
  }

  // Tenta clicar no botão que aciona a criação de API

  await new Promise(resolve => setTimeout(resolve, 3000));
  const buttonSelector =
    "#domain-pages > div > div.bg-white.dark\\:bg-black-90.rounded-2xl.p-6.mt-6 > div > div.text-right.my-6 > button";
  await page.click(buttonSelector, { waitUntil: "networkidle0" });

  const notaleatoria = Math.random().toString(36).substring(2, 15) + "899u";
  const inputSelector =
    "#dialog-container > div > div.dialog-body.overflow-y-auto.break-words.min-h-\\[6rem\\].scroll-smooth.px-2.py-1 > div > form > input";
  await page.waitForSelector(inputSelector, { timeout: 2000 });
  await page.type(inputSelector, String(notaleatoria), { delay: 100 });

  const confirmButtonSelector =
    "#dialog-container > div > div.dialog-body.overflow-y-auto.break-words.min-h-\\[6rem\\].scroll-smooth.px-2.py-1 > div > form > div > button";
  await page.click(confirmButtonSelector);

  // Extrai o API key (ou outro valor) da tabela
  await new Promise(r => setTimeout(r, 2000));
  const api = await page.evaluate(() => {
    const td = document.querySelector(
      "#domain-pages > div > div.bg-white.dark\\:bg-black-90.rounded-2xl.p-6.mt-6 > div > div.table-container > table > tbody > tr > td:nth-child(1)"
    );
    return td ? td.textContent.trim() : "";
  });
  console.log(api);
  return api;
}

async function SecurityTrails(page, browser, creds) {
  await EscreverNosCamposCadastro(page, browser, creds);
  // Outras lógicas, se necessário
}

module.exports = { SecurityTrails };
