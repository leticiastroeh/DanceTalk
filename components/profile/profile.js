export async function Profile() {
    return {
      template: await fetch("./components/profile/profile.html").then((r) => r.text()),
    };
  }
  