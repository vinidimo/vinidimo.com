# Fotos

Area estatica pronta para publicar em `vinidimo.com/fotos/`.

## Como manter

1. Crie uma pasta em `fotos/<slug>/`
2. Coloque as imagens de preview dentro dessa pasta
3. Adicione um `event.json` na mesma pasta
4. Aponte `cover` e `photos[].src` para arquivos locais, como `IMG_2351.jpg`
5. Rode:

```bash
node fotos/generate-photo-events.js
```

## Publicacao

- Para usar em `vinidimo.com/fotos/`, basta manter a pasta `fotos/` neste repo e publicar a branch `main` no GitHub Pages.

## Observacao

As imagens continuam sendo previews publicos com marca d'agua visual no front-end. Os originais em alta devem ficar fora da area publica do GitHub.
