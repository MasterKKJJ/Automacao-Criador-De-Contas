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

async function EscreverNosCamposCadastro(page, creds) {
  const signupUrl =
    "https://securitytrails.com/app/signup?utm_source=st-home&utm_medium=button&utm_campaign=top";
  await page.goto(signupUrl, { waitUntil: "domcontentloaded" });
  await delay(1000);

  // Verifica se o formulário esperado está presente
  // Caso o campo "#name" não exista, pode ser que um captcha ou outro elemento esteja no lugar
  const nameExists = await page.$("#name");
  if (!nameExists) {
    // Você pode optar por lançar um erro ou pausar para intervenção manual
    throw new Error(
      "Campo de cadastro não encontrado – possivelmente um captcha está impedindo a visualização."
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
  await page.click(
    "#app-content > div > div.relative.bg-white.dark\\:bg-black-90.w-full.p-8.grid > div > div > div > form > div:nth-child(7) > span > button",
    { waitUntil: "networkidle0" }
  );

  await AcessarApi(page, creds);
}

async function AcessarApi(page, creds) {
  const credentialsUrl = "https://securitytrails.com/app/account/credentials";
  if (page.url() !== credentialsUrl) {
    await page.goto(credentialsUrl);
  }

  // Tenta clicar no botão que aciona a criação de API
  const buttonSelector =
    "#domain-pages > div > div.bg-white.dark\\:bg-black-90.rounded-2xl.p-6.mt-6 > div > div.text-right.my-6 > button";
  await page.click(buttonSelector, { waitUntil: "networkidle0" });

  const notaleatoria = Math.floor(Math.random() * 100000) + 1;
  const inputSelector =
    "#dialog-container > div > div.dialog-body.overflow-y-auto.break-words.min-h-\\[6rem\\].scroll-smooth.px-2.py-1 > div > form > input";
  await page.type(inputSelector, String(notaleatoria), { delay: 100 });

  const confirmButtonSelector =
    "#dialog-container > div > div.dialog-body.overflow-y-auto.break-words.min-h-\\[6rem\\].scroll-smooth.px-2.py-1 > div > form > div > button";
  await page.click(confirmButtonSelector);

  // Extrai o API key (ou outro valor) da tabela
  const api = await page.evaluate(() => {
    const td = document.querySelector(
      "#domain-pages > div > div.bg-white.dark\\:bg-black-90.rounded-2xl.p-6.mt-6 > div > div.table-container > table > tbody > tr > td:nth-child(1)"
    );
    return td ? td.textContent.trim() : "";
  });
  console.log(api);
}

async function SecurityTrails(page, creds) {
  await EscreverNosCamposCadastro(page, creds);

  // Outras lógicas, se necessário
}

module.exports = { SecurityTrails };
