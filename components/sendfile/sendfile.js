export async function SendFilePage() {
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
            session,
          );
    
          this.newFolderName = null;
          this.foldering = false;
        },

        selectFolder(ev) {
          console.log(ev.target);
        }

      },

      template: await fetch("./components/sendfile/sendfile.html").then((r) => r.text()),
    };
    
  }
  