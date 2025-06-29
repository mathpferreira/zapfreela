const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

// Configurar pool de conexões MySQL
const db = mysql.createPool({
  host: 'localhost',
  user: 'root',       // seu usuário MySQL
  password: 'root',   // sua senha MySQL
  database: 'zapfreela'
});

// Rota teste simples para verificar servidor
app.get('/teste', (req, res) => {
  res.send('Servidor funcionando!');
});

// Buscar freelancers com filtros opcionais
app.get('/freelancers', (req, res) => {
  const { categoria, busca } = req.query;
  let sql = 'SELECT * FROM freelancers WHERE 1=1';
  const params = [];

  if (categoria && categoria !== 'all') {
    sql += ' AND categoria = ?';
    params.push(categoria);
  }

  if (busca) {
    sql += ' AND (nome LIKE ? OR descricao LIKE ?)';
    params.push(`%${busca}%`, `%${busca}%`);
  }

  db.query(sql, params, (err, results) => {
    if (err) {
      console.error('Erro no banco de dados:', err);
      return res.status(500).json({ error: 'Erro no banco de dados' });
    }
    res.json(results);
  });
});

// Cadastro de freelancer via POST
app.post('/cadastro', (req, res) => {
  const { nome, categoria, avaliacao, num_avaliacoes, descricao, telefone } = req.body;

  if (!nome || !categoria || !avaliacao || !num_avaliacoes || !descricao || !telefone) {
    return res.status(400).json({ error: 'Preencha todos os campos.' });
  }

  const sql = `
    INSERT INTO freelancers (nome, categoria, avaliacao, num_avaliacoes, descricao, telefone)
    VALUES (?, ?, ?, ?, ?, ?)
  `;

  db.query(sql, [nome, categoria, avaliacao, num_avaliacoes, descricao, telefone], (err, result) => {
    if (err) {
      console.error('Erro no cadastro:', err);
      return res.status(500).json({ error: 'Erro ao cadastrar no banco de dados.' });
    }
    res.status(201).json({ message: 'Freelancer cadastrado com sucesso!' });
  });
});

// Iniciar servidor ouvindo na porta 3000 em todas as interfaces
const PORT = 3000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
