document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('loginForm');

    loginForm.addEventListener('submit', (event) => {
        // Impede o envio padrão do formulário
        event.preventDefault();

        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;

        // Validação básica para garantir que os campos não estão vazios
        if (email === '' || password === '') {
            alert('Por favor, preencha todos os campos.');
            return;
        }

        // Simulação de login
        // Em um sistema real, você enviaria esses dados para um servidor para autenticação
        console.log('Dados enviados para autenticação:');
        console.log('E-mail:', email);
        console.log('Senha:', password);

        // Aqui você pode adicionar a lógica de requisição para um servidor,
        // por exemplo, usando `fetch()` para enviar os dados para sua API.
        
        alert('Login simulado realizado com sucesso!');
        // Após a autenticação bem-sucedida, você pode redirecionar o usuário para outra página
        // window.location.href = 'pagina_inicial.html';
        
    });

});

