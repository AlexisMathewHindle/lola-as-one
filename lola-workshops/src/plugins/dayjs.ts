// src/plugins/dayjs.js
import dayjs from "dayjs";
import advancedFormat from "dayjs/plugin/advancedFormat"; // example of a plugin
import relativeTime from "dayjs/plugin/relativeTime";

// Add any plugins you need
dayjs.extend(advancedFormat);
dayjs.extend(relativeTime);

export default {
  install(app: any) {
    app.config.globalProperties.$dayjs = dayjs;
  },
};
