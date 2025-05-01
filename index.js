import { createApp } from "vue";
import { GraffitiLocal } from "@graffiti-garden/implementation-local";
import { GraffitiRemote } from "@graffiti-garden/implementation-remote";
import { GraffitiPlugin } from "@graffiti-garden/wrapper-vue";
import { onMounted } from "vue";
import { defineAsyncComponent } from "vue";
import { createRouter, createWebHashHistory } from "vue-router";
import { fileToGraffitiObject, graffitiFileSchema } from "@graffiti-garden/wrapper-files";
import { GraffitiObjectToFile } from "@graffiti-garden/wrapper-files/vue";
import { Profile } from "./components/profile/profile.js";
// import { Menu } from "./components/menu/menu.js";

const Menu = {
  props: ['buttons'],
  template: `
      <div class="myMenu">
          <button v-for="button of buttons" @click="button.click(...button.params)">
              {{button.name}}
          </button>
      </div>
  `             
}

const router = createRouter({
    history: createWebHashHistory(),
    routes: [
      { path: "/profile/:username", component: Profile },
    ],
  });

createApp({
  data() {

    onMounted(async () => {
      this.$graffiti.sessionEvents.addEventListener('login', this.loginHandler);
      await this.$nextTick();
      const bar = document.querySelector('#messageBar');
      const configExt = {
        childList: true, 
      };
      const callbackExt = async (ev) => {
        await this.$nextTick();
        const list = document.querySelector('#messageBar');
        const config = {
          attributes: true, 
          childList: true, 
          subtree: true, 
          characterData: true
        };
        const callback = (mutationsList, observer) => {list.scrollTo(0, list.scrollHeight)};
        const observer = new MutationObserver(callback);
        observer.observe(list, config);
      };
      const observerExt = new MutationObserver(callbackExt);
      observerExt.observe(bar, configExt);
    })

    return {
      myMessage: "",
      sending: false,
      channels: ["designftwL"],
      groupName: null,
      currentChannel: "designftwL",
      currentGroup: null,
      inGroup: false,
      newMessage: "",
      editMode: null,
      renameMode: null,
      session: null,
      objectURL: null,
      oldMessage: null,
      oldGroupName: null,
      newGroupName: "",
      currentURL: null,
      flag: false,
      currentGroupAdmin: null,
      currentGroupURL: null,
      adding: false,
      addee: "",
      members: null,
      userURL: null,
      showingProfile: false,
      userFirst: "",
      userLast: "",
      userStyles: "",
      userTeams: "",
      profileObjectUrl: null,
      editingProfile: false,
      fileToUpload: undefined,
      fileUrl: "",
      graffitiFileSchema,
      renaming: false,
      editing: false,
    };
  },

  components: {
    Profile: defineAsyncComponent(Profile),
  },

  methods: {

    logout() {
      if (this.renameMode) {
        this.session = null;
        this.oldGroupName = null;
        this.newGroupName = null;
      }
      if (document.querySelector(".groupTools")) {
        document.querySelector(".groupTools").style.display = "none";
      }
      if(this.$router.currentRoute.value.path != '/') {
        this.$router.back()
      }
      this.exitGroup();
      this.$graffiti.logout(this.$graffitiSession.value);
      this.userFirst = "";
      this.userLast = "";
      this.userTeams = "";
      this.userStyles = "";
      this.profileObjectUrl = null;
      this.userURL = null;
      this.showingProfile = false;
    },

    async loginHandler() {
      this.userURL = "https://" + this.$graffitiSession.value.actor + ".profile.com";
      const profileObjectsIterator = this.$graffiti.discover([this.userURL], {
        properties: { 
          value: {
            required: ['username'],
            properties: {
              username: { type: "string" },
            }
          },
        }
      });

      let exists = false;

      for await (const { object } of profileObjectsIterator) {
        if (object.value.username == this.$graffitiSession.value.actor) {
          exists = true;
          this.userFirst = object.value.first;
          this.userLast = object.value.last;
          this.userTeams = object.value.teams;
          this.userStyles = object.value.styles;
          this.profileObjectUrl = object.url;
        }
      }

      if (!exists) {
        await this.$graffiti.put(
          {
            value: {
              username: this.$graffitiSession.value.actor,
              name: "",
              generator: "https://leticiastroeh.github.io/DanceTalk/",
              first: "",
              last: "",
              teams: "",
              styles: "",
              describes: this.$graffitiSession.value.actor,
            },
            channels: [this.userURL, "designftw-2025-studio1"],
          },
          this.$graffitiSession.value,
        );
      }
    },

    async login() {
      await this.$graffiti.login();
    },

    async showProfile() {
      if(this.$router.currentRoute.value.path != '/') {
        this.$router.back()
      }
      this.showingProfile = !this.showingProfile;
      this.userURL = "https://" + this.$graffitiSession.value.actor + ".profile.com";
      const profileObjectsIterator = this.$graffiti.discover([this.userURL], {
        properties: { 
          value: {
            required: ['username'],
            properties: {
              username: { type: "string" },
            }
          },
        }
      });

      let exists = false;

      for await (const { object } of profileObjectsIterator) {
        if (object.value.username == this.$graffitiSession.value.actor) {
          exists = true;
          this.userFirst = object.value.first;
          this.userLast = object.value.last;
          this.userTeams = object.value.teams;
          this.userStyles = object.value.styles;
          this.profileObjectUrl = object.url;
        }
      }
    },

    setEditingProfile() {
      this.editingProfile = !this.editingProfile;
    },

    async submitProfile() {
      this.sending = true;
      this.userURL = "https://" + this.$graffitiSession.value.actor + ".profile.com";
      const profileObjectsIterator = this.$graffiti.discover([this.userURL], {
        properties: { 
          value: {
            required: ['username'],
            properties: {
              username: { type: "string" },
            }
          },
        }
      });

      this.profileObjectUrl = null;
      for await (const { object } of profileObjectsIterator) {
        if (object.value.username == this.$graffitiSession.value.actor) {
          this.profileObjectUrl = object.url;
        }
      }

      await this.$graffiti.patch(
        {
          value: [
            {
              op: "replace",
              path: "/first",
              value: this.userFirst,
            },
            {
              op: "replace",
              path: "/last",
              value: this.userLast,
            },
            {
              op: "replace",
              path: "/name",
              value: this.userFirst + " " + this.userLast,
            },
            {
              op: "replace",
              path: "/teams",
              value: this.userTeams,
            },
            {
              op: "replace",
              path: "/styles",
              value: this.userStyles,
            },
            {
              op: "replace",
              path: "/describes",
              value: this.$graffitiSession.value.actor,
            },
          ]
        },
        this.profileObjectUrl,
        this.$graffitiSession.value,
      );

      this.sending = false;
      this.editingProfile = false;
    },

    async sendMessage(session) {
      if (!this.myMessage) return;

      this.sending = true;

      await this.$graffiti.put(
        {
          value: {
            content: this.myMessage,
            published: Date.now(),
          },
          channels: [this.currentChannel],
        },
        session,
      );

      this.sending = false;
      this.myMessage = "";

      // Refocus the input field after sending the message
      await this.$nextTick();
      this.$refs.messageInput.focus();
    },
    
    async createGroup(session) {
      if (!this.groupName) return;

      this.sending = true;
      const newChannel = crypto.randomUUID();

      await this.$graffiti.put(
        {
          value: {
            activity: 'Create',
            object: {
              type: 'Group Chat',
              name: this.groupName,
              channel: newChannel,
              members: [session.actor],
            },
          },
          channels: this.channels,
        },
        session,
      );

      await this.$graffiti.put(
        {
          value: {
            name: this.groupName,
            describes: newChannel,
          },
          channels: this.channels,
        },
        session,
      );

      this.sending = false;
      this.groupName = "";
    },

    async enterGroup(channel, groupName, admin, url, members) {
      if(this.$router.currentRoute.value.path != '/') {
        this.$router.back()
      }
      this.exitGroup();
      this.showingProfile = false;
      if (!channel) return;
      this.inGroup = true;
      this.currentChannel = channel;
      let result =  await this.getGroupName(channel); 
      this.currentGroup = groupName;
      this.currentURL = result.url;
      this.currentGroupAdmin = admin;
      this.currentGroupURL = url;
      this.members = members;
    },

    exitGroup() {
      this.inGroup = false;
      this.currentChannel = this.channels[0];
      this.currentURL = null;
      this.currentGroup = null;
      this.currentGroupAdmin = null;
      this.currentGroupURL = null;
      this.members = null;
      this.session = null;
      this.oldGroupName = null;
      this.newGroupName = null;
      this.renaming = false;
      this.editing = false;
      this.oldMessage = null;
      this.newMessage = null;
      if (document.querySelector(".groupTools")) {
        document.querySelector(".groupTools").style.display = "none";
      }
    },

    async deleteMessage(session, objectURL) {
      document.querySelector(".tools").style.display = "none";
      if (!objectURL) return;

      this.sending = true;

      await this.$graffiti.delete(
        objectURL,
        session,
      );

      this.sending = false;
    },

    async deleteGroup(session, groupURL) {
      document.querySelector(".groupTools").style.display = "none";
      if (!groupURL) return;

      this.sending = true;

      await this.$graffiti.delete(
        groupURL,
        session,
      );

      this.sending = false;
      this.exitGroup();
    },

    addParticipantButtonHandler() {
      document.querySelector(".groupTools").style.display = "none";
      this.adding = !this.adding;
    },

    async addParticipant(session) {
      if (!this.currentGroupURL) return;
      if (!this.addee) return;

      this.sending = true;
      this.members.push(this.addee)

      await this.$graffiti.patch(
        {
          value: [
            {
              op: "replace",
              path: "/object/members",
              value: this.members,
            }
          ]
        },
        this.currentGroupURL,
        session,
      );

      this.addee = "";
      this.adding = false;
      this.sending = false;
      // Refocus the input field after sending the message
      await this.$nextTick();
      this.$refs.messageInput.focus();
    },

    cancelAdd() {
      this.addee = "";
      this.adding = false;
      this.sending = false;
    },

    isEditing(session, objectURL, oldMessage) {
      Array.from(document.querySelectorAll(".tools")).forEach((el) => el.style.display = "none");
      if (this.editing) {
        this.objectURL = null;
        this.session = null;
        this.oldMessage = null;
        this.newMessage = null;
        this.editing = false;
        return;
      }
      this.editing = true;
      this.oldMessage = oldMessage;
      this.newMessage = oldMessage;
      this.session = session;
      this.objectURL = objectURL;
    },

    async editMessage() {
      if (!this.objectURL) return;
      if (!this.newMessage) return;
      if (this.oldMessage == this.newMessage) return;

      this.sending = true;

      await this.$graffiti.patch(
        {
          value: [
            {
              op: "replace",
              path: "/content",
              value: this.newMessage,
            }
          ]
        },
        this.objectURL,
        this.session,
      );

      this.sending = false;
      this.session = null;
      this.objectURL = null;
      this.oldMessage = null;
      this.newMessage = null;
      this.editing = false;
      // Refocus the input field after sending the message
      await this.$nextTick();
      this.$refs.messageInput.focus();
    },

    cancelEdit() {
      this.session = null;
      this.objectURL = null;
      this.oldMessage = null;
      this.newMessage = null;
      this.editing = false;
      return;
    },

    openTools(ev) {
      let tgt = ev.target;
      if (ev.target.tagName == "IMG") {
        tgt = ev.target.parentElement;
      }
      if (!tgt.parentElement.nextElementSibling.style.display || tgt.parentElement.nextElementSibling.style.display == 'none') {
        tgt.parentElement.nextElementSibling.style.display = "block";
        return;
      }
      tgt.parentElement.nextElementSibling.style.display = "none";
    },

    openSendTools() {
      let tgt = document.querySelector(".sendTools");
      if (!tgt.style.display || tgt.style.display == 'none') {
        tgt.style.display = "block";
        return;
      }
      tgt.style.display = "none";
    },

    openGroupTools(ev) {
      let tgt = ev.target;
      if (ev.target.tagName == "IMG") {
        tgt = ev.target.parentElement;
      }
      if (!tgt.parentElement.nextElementSibling.style.display || tgt.parentElement.nextElementSibling.style.display == 'none') {
        tgt.parentElement.nextElementSibling.style.display = "block";
        return;
      }
      tgt.parentElement.nextElementSibling.style.display = "none";
    },

    renameButtonHandler(session) {
      document.querySelector(".groupTools").style.display = "none";
      if (this.renaming) {
        this.renaming = false;
        this.session = null;
        this.newGroupName = null;
        return;
      }
      this.renaming = true;
      this.session = session;
      this.newGroupName = this.currentGroup;
    },

    async renameGroup() {
      if (!this.newGroupName) return;

      this.sending = true;

      let a = await this.$graffiti.patch(
        {
          value: [
            {
              op: "replace",
              path: "/object/name",
              value: this.newGroupName,
            }
          ]
        },
        this.currentGroupURL,
        this.session,
      );

      let result = await this.getGroupName(this.currentChannel);
      this.currentGroup = this.newGroupName;
      this.currentURL = result.url;

      this.sending = false;
      this.session = null;
      this.newGroupName = null;
      this.renaming = false;
    },

    cancelRename() {
      this.renaming = false;
      this.session = null;
      this.oldGroupName = null;
      this.newGroupName = null;
      return;
    },

    async getGroupName(channel) {
      const namesObjectsIterator = this.$graffiti.discover(this.channels, {
        properties: { 
          value: {
            required: ['name', 'describes'],
            properties: {
              name: { type: "string" },
              describes: { type: "string" },
            }
          },
        }
      });

      // const newNamesObjects = [];
      let groupName = null;
      let groupURL = null;
      for await (const { object } of namesObjectsIterator) {
        if (object.value.describes == channel) {
          groupName = object.value.name;
          groupURL = object.url;
        }
      }
      return {name: groupName, url: groupURL};
    },

    async viewProfile(user) {
      this.$router.push({ path: '/profile/' + user});
    },

    setFileToUpload(event) {
      const target = event.target;
      if (!target.files?.length) return;
      this.fileToUpload = target.files[0];
    },

    async uploadFile(session) {
      if (!this.fileToUpload) return;

      const pictureURL = "https://" + this.$graffitiSession.value.actor + ".profilepicture.com";
      const profileObjectsIterator = this.$graffiti.discover([pictureURL], {
        properties: {
          value: {
          },
        }
      });

      let pictureObjectURL = null;

      for await (const { object } of profileObjectsIterator) {
        pictureObjectURL = object.url;
      }

      if (!pictureObjectURL) {
        const object = await fileToGraffitiObject(
          this.fileToUpload,
        );
        object.channels = ["https://" + this.$graffitiSession.value.actor + ".profilepicture.com"];
        const { url } = await this.$graffiti.put(
          object,
          session,
        );
        this.fileUrl = url;
      }
      
      else {
        const object = await fileToGraffitiObject(
          this.fileToUpload,
        );
        const { url } = await this.$graffiti.patch(
          {
            value: [
              {
                op: "replace",
                path: "/name",
                value: object.value.name,
              },
              {
                op: "replace",
                path: "/data",
                value: object.value.data,
              },
              {
                op: "replace",
                path: "/mimetype",
                value: object.value.mimetype,
              },
            ]
          },
          pictureObjectURL,
          this.$graffitiSession.value,
        );
        this.fileUrl = url;
      }
    },
  },
})
  .use(GraffitiPlugin, {
    // graffiti: new GraffitiLocal(),
    graffiti: new GraffitiRemote(),
  })
  .use(router)
  .component('my-menu', Menu)
  .component('GraffitiObjectToFile', GraffitiObjectToFile)
  .mount("#app");