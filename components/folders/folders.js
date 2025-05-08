export async function FoldersPage() {
    return {
      data() {
        return {
          foldering: false,
          newFolderName: "",
        };
      },

      methods: {
        newFolderButtonHandler() {
          this.foldering = !this.foldering;
          this.newFolderName = "";
        },

        cancelFoldering() {
          this.foldering = false;
          this.newFolderName = "";
          return;
        },

        async addFolder(groupid) {
          if (!this.newFolderName) return;
          console.log(this.$graffitiSession.value);
    
          await this.$graffiti.put(
            {
              value: {
                name: this.newFolderName,
                describes: 'https://' + groupid + '.folders.com/' + this.newFolderName,
              },
              channels: ['https://' + groupid + '.folders.com'],
            },
            this.$graffitiSession.value,
          );
    
          this.newFolderName = null;
          this.foldering = false;
        },

        enterFolder(groupid, name) {
          this.$router.push({ path: '/files/' + groupid + '/folder/' + name});
        }

      },

      template: await fetch("./components/folders/folders.html").then((r) => r.text()),
    };
    
  }
  