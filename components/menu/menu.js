export default Menu = {
    data() {
      return {
        count: 0
      }
    },
    props: ['buttons'],
    template: `
        <button v-for="button of this.buttons" @click="button.click">
            {{button.name}}
        </button>
    `             
  }