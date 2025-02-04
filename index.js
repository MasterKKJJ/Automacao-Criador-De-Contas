const { connect } = require("puppeteer-real-browser");
const readline = require("readline");
const StealthPlugin = require("puppeteer-extra-plugin-stealth");

const { CriarEmail } = require("./Temp-Mail-Mais-Atualizado");
const { BinaryEdge } = require("./BinaryEdge");
const { SecurityTrails } = require("./SecurityTrails");

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
    ? userInput.trim()
    : Math.random().toString(36).substring(2, 15);

  const lastNameInput = await askQuestion("Informe o last name: ");
  const lastName = lastNameInput
    ? lastNameInput.trim()
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
  const password = passwordInput.trim()
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

async function main() {
  console.clear();
  const creds = await getUserCredentials();
  let browser, page;
  try {
    // Conecta ao navegador
    ({ page, browser } = await connect({
      args: ["--flag-switches-begin", "--flag-switches-end"],
      turnstile: true,
      headless: false, // Mantém o navegador visível
      customConfig: {
        // chromePath:
        //   "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
        // userDataDir:
        //   "C:\\Users\\maste\\AppData\\Local\\Google\\Chrome\\User Data\\Default"
      },
      connectOption: { defaultViewport: null },
      plugins: [StealthPlugin()]
    }));
    await page.setUserAgent(
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/132.0.0.0 Safari/537.36"
    );
    // await page.setUserAgent(
    //   "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:132.0) Gecko/20100101 Firefox/132.0"
    // );

    // await BinaryEdge(page, creds);
    await SecurityTrails(page, browser, creds);
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
