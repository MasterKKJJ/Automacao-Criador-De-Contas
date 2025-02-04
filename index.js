const { connect } = require("puppeteer-real-browser");
const readline = require("readline");
const pluginStealth = require("puppeteer-extra-plugin-stealth");

const { CriarEmail } = require("./Temp-Mail-Mais-Atualizado");

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

  // Aguarda um tempo para visualização (opcional)
  await new Promise(r => setTimeout(r, 1000));
}
async function CriarContaBinary(page, credentials) {
  await RealmenteCriarContaNoBinary(page, credentials);
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
      plugins: [pluginStealth()]
    }));
    await page.setUserAgent(
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:132.0) Gecko/20100101 Firefox/132.0"
    );

    await CriarContaBinary(page, creds);

    // em breve teremos mais sites de api para criar !
    // await CriarContaBinary(); // Comente essa linha para não criar conta
    // const { email } = await CriarEmail(); // criar email
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
