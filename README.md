#Vídeo de Como está: 


https://github.com/user-attachments/assets/246599c6-a615-4d43-941d-4ace3fe525f7



# Automação de Criação de Contas com Autoverificação de Email

Este projeto utiliza o [puppeteer-real-browser](https://www.npmjs.com/package/puppeteer-real-browser) para automatizar a criação de contas em diversas plataformas. Ele coleta credenciais via console, gera dados aleatórios quando necessário e integra com o TempMail no qual fazemos o autoverificador de email, mantendo o navegador aberto para ações futuras.

## Funcionalidades

- **Coleta de Credenciais:** Permite inserir manualmente ou gerar valores aleatórios (username, sobrenome, senha, email, etc.).
- **Email Temporário:** Integração com TempMail para criação e monitoramento automático de emails.
- **Automação de Formulários:** Preenche e envia formulários de criação de conta utilizando o puppeteer-real-browser.
- **Fluxo Modular:** Fácil de integrar com outras automações e APIs de criação de contas.

## Como Usar

1. Clone o repositório.
2. Instale as dependências:
   ```bash
    npm install
    ```
3. Executar o script principal:
    ```bash
    node index.js
    ```
