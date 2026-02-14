export class HelperFunctions {
  public setEnvironment(env: any) {
    const isDevEnv =
      env === "development" ||
      window.location.hostname.includes("localhost") ||
      window.location.hostname.includes("lola-workshops-dev.web.app");

    const envToSet = isDevEnv ? "development" : "production";
    localStorage.setItem("appEnvironment", envToSet);
  }

  public getEnvironment() {
    return localStorage.getItem("appEnvironment");
  }
}
