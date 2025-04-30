import { createApp } from "vue";
import { GraffitiLocal } from "@graffiti-garden/implementation-local";
import { GraffitiRemote } from "@graffiti-garden/implementation-remote";
import { GraffitiPlugin } from "@graffiti-garden/wrapper-vue";
import { onMounted } from "vue";
import { defineAsyncComponent } from "vue";
import { createRouter, createWebHashHistory } from "vue-router";
import { Profile } from "./components/profile/profile.js"

const router = createRouter({
    history: createWebHashHistory(),
    routes: [
      { path: "/profile/:username", component: Profile },
    ],
  });

createApp({
  data() {

    onMounted(async () => {
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
      channels: ["designftw"],
      groupName: null,
      currentChannel: "designftw",
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
    };
  },

  components: {
    Profile: defineAsyncComponent(Profile),
  },

  methods: {

    logout() {
      if (this.renameMode) {
        const location = this.renameMode.parentElement.previousElementSibling.previousElementSibling;
        location.lastChild.remove();
        location.lastChild.remove();
        location.lastChild.remove();
        this.renameMode = null;
        this.session = null;
        this.oldGroupName = null;
        this.newGroupName = null;
      }
      if (document.querySelector(".groupTools")) {
        document.querySelector(".groupTools").style.display = "none";
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

    async login() {
      this.$graffiti.login();
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
              first: "",
              last: "",
              teams: "",
              styles: "",
            },
            channels: [this.userURL],
          },
          this.$graffitiSession.value,
        );
      }
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
              path: "/teams",
              value: this.userTeams,
            },
            {
              op: "replace",
              path: "/styles",
              value: this.userStyles,
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

      // Refocus the input field after sending the message
      await this.$nextTick();
      this.$refs.messageInput.focus();
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
      this.currentGroup = result.name;
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
      if (this.renameMode) {
        const location = this.renameMode.parentElement.previousElementSibling.previousElementSibling;
        location.lastChild.remove();
        location.lastChild.remove();
        location.lastChild.remove();
        this.renameMode = null;
        this.session = null;
        this.oldGroupName = null;
        this.newGroupName = null;
      }
      if (document.querySelector(".groupTools")) {
        document.querySelector(".groupTools").style.display = "none";
      }
      if (this.editMode) {
        this.editMode.parentElement.nextElementSibling.remove();
        this.editMode.parentElement.nextElementSibling.remove();
        this.editMode.parentElement.nextElementSibling.remove();
        this.editMode = null;
      }
    },

    async deleteMessage(session, objectURL) {
      if (!objectURL) return;

      this.sending = true;

      await this.$graffiti.delete(
        objectURL,
        session,
      );

      this.sending = false;
      // Refocus the input field after sending the message
      await this.$nextTick();
      this.$refs.messageInput.focus();
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
      // Refocus the input field after sending the message
      await this.$nextTick();
      this.$refs.messageInput.focus();
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

    isEditing(event, session, objectURL, oldMessage) {
      if (this.editMode) {
        this.editMode.parentElement.nextElementSibling.remove();
        this.editMode.parentElement.nextElementSibling.remove();
        this.editMode.parentElement.nextElementSibling.remove();
        this.editMode = null;
        return;
      }
      this.session = session;
      this.objectURL = objectURL;
      this.oldMessage = oldMessage;
      this.editMode = event.target;
      const taskTemplate = document.querySelector("#editTemplate");
      this.editMode.parentElement.insertAdjacentHTML('afterend', taskTemplate.lastChild.outerHTML);
      this.editMode.parentElement.insertAdjacentHTML('afterend', taskTemplate.firstChild.nextElementSibling.outerHTML);
      this.editMode.parentElement.insertAdjacentHTML('afterend', taskTemplate.firstChild.outerHTML);

      const inputBox = this.editMode.parentElement.nextElementSibling;
      inputBox.value = oldMessage;
      const saveButton = this.editMode.parentElement.nextElementSibling.nextElementSibling;
      inputBox.addEventListener('input', (e) => {this.newMessage = e.target.value;});
      saveButton.addEventListener('click', () => this.editMessage());
      const cancelButton = this.editMode.parentElement.nextElementSibling.nextElementSibling.nextElementSibling;
      cancelButton.addEventListener('click', () => this.cancelEdit());
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
      this.editMode.parentElement.nextElementSibling.remove();
      this.editMode.parentElement.nextElementSibling.remove();
      this.editMode.parentElement.nextElementSibling.remove();
      
      this.editMode = null;
      this.session = null;
      this.objectURL = null;
      this.oldMessage = null;
      // Refocus the input field after sending the message
      await this.$nextTick();
      this.$refs.messageInput.focus();
    },

    cancelEdit() {
      this.editMode.parentElement.nextElementSibling.remove();
      this.editMode.parentElement.nextElementSibling.remove();
      this.editMode.parentElement.nextElementSibling.remove();
      this.editMode = null;
      this.session = null;
      this.objectURL = null;
      this.oldMessage = null;
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

    isRenaming(event, session) {
      document.querySelector(".groupTools").style.display = "none";
      const location = event.target.parentElement.previousElementSibling.previousElementSibling;
      if (this.renameMode) {
        location.lastChild.remove();
        location.lastChild.remove();
        location.lastChild.remove();
        this.renameMode = null;
        this.session = null;
        this.oldGroupName = null;
        this.newGroupName = null;
        return;
      }
      this.session = session;
      this.oldGroupName = this.currentGroup;
      this.renameMode = event.target;
      const taskTemplate = document.querySelector("#renameTemplate");
      location.insertAdjacentHTML('beforeend', taskTemplate.firstChild.outerHTML);
      location.insertAdjacentHTML('beforeend', taskTemplate.firstChild.nextSibling.outerHTML);
      location.insertAdjacentHTML('beforeend', taskTemplate.lastChild.outerHTML);

      const inputBox = location.lastChild.previousElementSibling.previousElementSibling;
      inputBox.value = this.oldGroupName;
      const saveButton = location.lastChild.previousElementSibling;
      inputBox.addEventListener('input', (e) => {this.newGroupName = e.target.value;});
      saveButton.addEventListener('click', () => this.renameGroup());
      const cancelButton = location.lastChild;
      cancelButton.addEventListener('click', () => this.cancelRename());
    },

    async renameGroup() {
      if (!this.newGroupName) return;
      if (this.oldGroupName == this.newGroupName) return;

      this.sending = true;

      await this.$graffiti.patch(
        {
          value: [
            {
              op: "replace",
              path: "/name",
              value: this.newGroupName,
            }
          ]
        },
        this.currentURL,
        this.session,
      );

      let result = await this.getGroupName(this.currentChannel);
      this.currentGroup = result.name;
      this.currentURL = result.url;

      this.sending = false;
      const location = this.renameMode.parentElement.previousElementSibling.previousElementSibling;
      location.lastChild.remove();
      location.lastChild.remove();
      location.lastChild.remove();
      
      this.renameMode = null;
      this.session = null;
      this.oldGroupName = null;
      this.newGroupName = null;
      // Refocus the input field after sending the message
      await this.$nextTick();
      this.$refs.messageInput.focus();
    },

    cancelRename() {
      const location = this.renameMode.parentElement.previousElementSibling.previousElementSibling;
      location.lastChild.remove();
      location.lastChild.remove();
      location.lastChild.remove();
      this.renameMode = null;
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
  },
})
  .use(GraffitiPlugin, {
    graffiti: new GraffitiLocal(),
    // graffiti: new GraffitiRemote(),
  })
  .use(router)
  .mount("#app");
