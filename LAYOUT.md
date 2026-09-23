# Cabeçalho e rodapé compartilhados

O cabeçalho e o rodapé usados nas páginas do site ficam em:

- `partials/header.html`
- `partials/footer.html`

Os estilos e comportamentos comuns ficam em `shared-layout.css` e
`shared-layout.js`.

Depois de alterar um desses arquivos, execute:

```bash
node generate-layout.js
```

Para regenerar também projetos, artigos e eventos de fotos, execute:

```bash
node build.js
```

O workflow `.github/workflows/generate-site.yml` também atualiza as páginas
automaticamente quando os componentes compartilhados são alterados no GitHub.

A página `404.html` recebe o mesmo cabeçalho das demais páginas, mas permanece
sem rodapé para preservar o efeito visual exclusivo dessa tela.
