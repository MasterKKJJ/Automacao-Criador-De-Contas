const { connect } = require("puppeteer-real-browser");
const readline = require("readline");
const StealthPlugin = require('puppeteer-extra-plugin-stealth');

const { CriarEmail } = require("./Temp-Mail-Mais-Atualizado");
const {BinaryEdge}= require("./BinaryEdge");
const {SecurityTrails } =require("./SecurityTrails");

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

async function getUserCredentials() {
  console.log("Se você quiser aleatóriamente, apenas clique Enter !");
  const userInput = await askQuestion("Informe o username: ");
  const user = userInput
    ? userInput
    : Math.random().toString(36).substring(2, 15);

  const lastNameInput = await askQuestion("Informe o last name: ");
  const lastName = lastNameInput
    ? lastNameInput
    : Math.random().toString(36).substring(2, 15);

  console.log("\nEscolha entre as opções:");
  console.log("1) Passar um email seu");
  console.log(
    "2) Criar um email temporário que se confirma automaticamente (Temp-Mail)"
  );
  console.log("3) Criar um email aleatório");

  const opcao = await askQuestion("Opção: ");
  let email;

  switch (opcao.trim()) {
    case "1":
      email = await askQuestion("Informe o email: ");
      break;
    case "2": {
      // Chama a função CriarEmail, que retorna um objeto contendo o email temporário gerado
      const { email: tempEmail } = await CriarEmail();
      email = tempEmail;
      break;
    }
    case "3":
      email = Math.random().toString(36).substring(2, 15) + "@gmail.com";
      break;
    default:
      console.log("Opção inválida. Utilizando email aleatório.");
      email = Math.random().toString(36).substring(2, 15) + "@gmail.com";
      break;
  }

  const company = Math.random().toString(36).substring(2, 15);

  const passwordInput = await askQuestion("Informe a senha: ");
  const password = passwordInput
    ? passwordInput
    : Math.random().toString(36).substring(2, 15);
  console.clear();
  console.log(`Você estará criando conta com esses dados:
      User: ${user}
      Last Name: ${lastName}
      Company: ${company}
      Password: ${password}
      Email: ${email}`);

  return { user, lastName, company, password, email };
}
async function preencherCampos(page, credentials) {
  await page.type(
    "body > div.mai-wrapper.ng-scope > div > div > div > div.col-md-6.form-message > form > div:nth-child(1) > div:nth-child(1) > div > input",
    credentials.user,
    { delay: 100 }
  );
  await page.type(
    "body > div.mai-wrapper.ng-scope > div > div > div > div.col-md-6.form-message > form > div:nth-child(1) > div:nth-child(2) > div > input",
    credentials.lastName,
    { delay: 100 }
  );
  await page.type(
    "body > div.mai-wrapper.ng-scope > div > div > div > div.col-md-6.form-message > form > div:nth-child(2) > div > input",
    credentials.company,
    { delay: 100 }
  );
  await page.type(
    "body > div.mai-wrapper.ng-scope > div > div > div > div.col-md-6.form-message > form > div:nth-child(3) > div > input",
    credentials.email,
    { delay: 100 }
  );
  await page.type(
    "body > div.mai-wrapper.ng-scope > div > div > div > div.col-md-6.form-message > form > div:nth-child(4) > div:nth-child(1) > div > input",
    credentials.password,
    { delay: 100 }
  );
  await page.type(
    "body > div.mai-wrapper.ng-scope > div > div > div > div.col-md-6.form-message > form > div:nth-child(4) > div:nth-child(2) > div > input",
    credentials.password,
    { delay: 100 }
  );

  // Clica no botão para enviar o formulário
  await page.click(
    "body > div.mai-wrapper.ng-scope > div > div > div > div.col-md-6.form-message > form > div.form-group.sign-up-submit > button"
  );
}
async function RealmenteCriarContaNoBinary(page, credentials) {
  await page.goto("https://app.binaryedge.io/sign-up", {
    waitUntil: "domcontentloaded"
  });

  console.log(
    "Resolva o captcha na página e, quando estiver pronto, pressione Enter..."
  );
  await askQuestion("Pressione Enter quando tiver passado pelo captcha: ");
  await preencherCampos(page, credentials);
  console.log("Conta criada na BinaryEdge!");
  await new Promise(r => setTimeout(r, 1000));
  await LogarNaContaCriada(page, credentials);
}
async function CriarContaBinary(page, credentials) {
  await RealmenteCriarContaNoBinary(page, credentials);
 
}

async function LogarNaContaCriada(page, credentials) {
  const url ="https://app.binaryedge.io/login";
  if(page.url != url){
    await page.goto(url, {
      waitUntil: "domcontentloaded"
    });
  }
  await page.type("#username", credentials.email, { delay: 100 });
  await page.type("#password", credentials.password, { delay: 100 });
  await page.click(
    "body > div.mai-wrapper.ng-scope > div > div > div > div.col-md-6.form-message > form > div.form-group.login-submit > button"
  );
 // 
 await new Promise(r => setTimeout(r, 2000));


 async function getErrorText(page) {
  return await page.evaluate(() => {
    const mailEl = document.querySelector(
      "body > div.mai-wrapper.ng-scope > div > div > div > div.col-md-6.form-message > form > div.col-sm-12.text-danger > small"
    );
    return mailEl ? (mailEl.innerText || mailEl.value || "").toLowerCase() : "";
  });
}

const buttonSelector = "body > div.mai-wrapper.ng-scope > div > div > div > div.col-md-6.form-message > form > div.form-group.login-submit > button";

// Obtém o texto do erro uma vez
let errorText = await getErrorText(page);

// Caso 1: Erro de credencial
if (errorText.includes("unable to log in with provided credentials.")) {
  throw new Error("Erro de credencial: unable to log in with provided credentials.");
} 
// Caso 2: Conta não verificada
else if (errorText.includes("user account is unverified, please verify your e-mail.")) {
  const maxRetries = 10;
  let retries = 1;
  
  while (retries < maxRetries) {
    console.log("Tentativa Número: " + retries);
    await page.click(buttonSelector);
    // Aguarda 4 segundos antes de reavaliar
    await new Promise(resolve => setTimeout(resolve, 4000));
    errorText = await getErrorText(page);
    // Se o erro não estiver mais presente, sai do loop
    if (!errorText.includes("user account is unverified, please verify your e-mail.")) {
      break;
    }
    retries++;
  }
  
  // Se mesmo após as tentativas o erro persistir, lança exceção
  if (errorText.includes("user account is unverified, please verify your e-mail.")) {
    throw new Error("Há erros não reparados, tente novamente!");
  }
}

  await new Promise(r => setTimeout(r, 4000));
  await page.goto("https://app.binaryedge.io/account/api", {
    waitUntil: "networkidle2"
  });

  console.log("Criando sua API da BinaryEdge...");
  const but =
    "body > div.mai-wrapper.ng-scope > div:nth-child(3) > div:nth-child(2) > div:nth-child(2) > div > div.panel-heading > div > div:nth-child(3) > div > div > button.btn.btn-small.btn-primary";

  await page.waitForSelector(but);
  await page?.click(but, { waitUntil: "networkidle2" });
  await new Promise(r => setTimeout(r, 2000));


  const api = await page.evaluate(() => {
    const api =  document.querySelector(
      "body > div.mai-wrapper.ng-scope > div:nth-child(3) > div:nth-child(2) > div:nth-child(2) > div > div.panel-heading > div > div:nth-child(3) > div > input"
    ) ;
    
    return api ? api.value : null ;
  })
  console.warn("API BinaryEdge: "+api)

}

async function main() {
  console.clear();
  const creds = await getUserCredentials();
  let browser, page;
  try {
    // Conecta ao navegador
    ({ page, browser } = await connect({
      args: [],
      turnstile: true,
      headless: false, // Mantém o navegador visível
      customConfig: {},
      connectOption: { defaultViewport: null },
      plugins: [StealthPlugin()]
    }));
    await page.setUserAgent(
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:132.0) Gecko/20100101 Firefox/132.0"
    );
    
    // await BinaryEdge(page, creds)
    await SecurityTrails(page, creds)


  } catch (error) {
    console.error("Erro na execução:", error);
  } finally {
    // Fecha o navegador, se estiver aberto
    if (browser) {
      await new Promise(r => setTimeout(r, 1000));
    }
  }
}


main();
