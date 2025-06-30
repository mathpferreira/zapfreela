  const tipoUsuario = document.querySelector('select[name="tipo"]');
  const camposFreelancer = document.getElementById('camposFreelancer');

  tipoUsuario.addEventListener('change', () => {
    if (tipoUsuario.value === 'freelancer') {
      camposFreelancer.style.display = 'block';
    } else {
      camposFreelancer.style.display = 'none';
    }
  });

  const formCadastro = document.getElementById('formCadastro');
  const msg = document.getElementById('mensagemCadastro');

  formCadastro.addEventListener('submit', async (e) => {
    e.preventDefault();
    const dados = Object.fromEntries(new FormData(formCadastro));

    try {
      // 1º passo: cadastrar usuário
      const resUsuario = await fetch('http://localhost:3000/usuarios', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nome: dados.nome,
          email: dados.email,
          telefone: dados.telefone,
          senha: dados.senha,
          tipo: dados.tipo
        })
      });

      const usuarioCriado = await resUsuario.json();
      if (!resUsuario.ok) throw new Error(usuarioCriado.error || 'Erro ao cadastrar usuário');

      // 2º passo: se for freelancer, cadastrar também como freelancer
      if (dados.tipo === 'freelancer') {
        const resFreelancer = await fetch('http://localhost:3000/freelancers', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            usuario_id: usuarioCriado.id,
            categoria_nome: dados.categoria,
            descricao: dados.descricao
          })
        });

        const freelancerCriado = await resFreelancer.json();
        if (!resFreelancer.ok) throw new Error(freelancerCriado.error || 'Erro ao cadastrar freelancer');
      }

      msg.textContent = 'Cadastro realizado com sucesso!';
      msg.style.color = 'green';
      formCadastro.reset();
      camposFreelancer.style.display = 'none';

    } catch (error) {
      msg.textContent = error.message || 'Erro ao cadastrar.';
      msg.style.color = 'red';
    }

  });