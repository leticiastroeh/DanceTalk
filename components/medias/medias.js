export async function MediasPage() {
  return {
    template: await fetch("./components/medias/medias.html").then((r) => r.text()),
  };
}
  