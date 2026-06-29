# Fotos

Area estatica pronta para publicar em `vinidimo.com/fotos/`.

## Como manter

1. Crie uma pasta em `assets/photo-events/<slug>/`
2. Adicione um `event.json` com os dados do evento
3. Aponte `cover` e `photos[].src` para previews publicos
4. Rode:

```bash
node fotos/generate-photo-events.js
```

## Publicacao

- Para usar em `vinidimo.com/fotos/`, basta manter a pasta `fotos/` neste repo e publicar a branch `main` no GitHub Pages.

## Observacao

As imagens continuam sendo previews publicos com marca d'agua visual no front-end. Os originais em alta devem ficar fora da area publica do GitHub.
