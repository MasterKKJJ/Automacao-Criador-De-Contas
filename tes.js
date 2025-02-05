let primeiraTentativa = true;

function capturarErro() {
  try {
    const erro = "Congratulations! Your account has been created successfully!";

    return erro;
  } catch (e) {
    console.log("Nenhum erro detectado.");
    return null;
  }
}
function main() {
  const teste = Math.random().toString(36).substring(2, 15) + "899u";
  console.log(String(teste));
}
main();
