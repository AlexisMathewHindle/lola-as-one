<template>
  <div class="c-login">
    <h2>Login</h2>
    <form @submit.prevent="login">
      <div class="form-group">
        <label for="email">Email:</label>
        <input type="email" v-model="email" required />
      </div>
      <div class="form-group">
        <label for="password">Password:</label>
        <input type="password" v-model="password" required />
      </div>
      <v-btn class="btn" type="submit">Login</v-btn>
      <p v-if="error">{{ error }}</p>
    </form>
  </div>
  <!-- </div> -->
</template>
<script lang="ts">
import { ref } from "vue";
import { useRouter } from "vue-router";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "@/main";

export default {
  name: "LoginForm",
  setup() {
    const email = ref("");
    const password = ref("");
    const error = ref("");
    const router = useRouter();

    const login = async () => {
      try {
        await signInWithEmailAndPassword(auth, email.value, password.value);
        error.value = "";
        router.push("/admin");
        // Handle successful login (e.g., redirect to a dashboard)
      } catch (err) {
        error.value = "Failed to login. Please check your credentials.";
      }
    };

    return {
      email,
      password,
      error,
      login,
    };
  },
};
</script>
<style scoped>
.c-login {
  max-width: 400px;
  margin: 50px auto;
  padding: 20px;
  border: 1px solid var(--light-grey);
  border-radius: 5px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
}

.form-group {
  margin-bottom: 15px;
}

label {
  display: block;
  margin-bottom: 5px;
}

input {
  width: 100%;
  padding: 8px;
  box-sizing: border-box;
}

p {
  color: var(--errors);
  margin-top: 10px;
}
</style>
