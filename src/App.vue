<template>
  <div id="app">
    <router-view />
  </div>
</template>

<script>
export default {
  name: 'App',
}
</script>

<style>
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #fcde9c;
  height: 100vh;
  height: 100dvh; /* Dynamic viewport height for mobile */
  background: linear-gradient(135deg, #ebf063 0%, #896b2a 100%);
  overflow: hidden;
}
</style>
