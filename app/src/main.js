import { createApp } from 'vue'
import { createPinia } from 'pinia'
import router from './router'
import { useAuthStore } from './stores/auth'
import './style.css'
import App from './App.vue'

// Font Awesome
import { library } from '@fortawesome/fontawesome-svg-core'
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'
import {
  faHome, faBox, faCalendar, faNewspaper, faShoppingCart, faUsers,
  faCog, faPlus, faEdit, faTrash, faSearch, faFilter, faEye,
  faBars, faTimes, faChevronDown, faChevronUp, faChevronLeft, faChevronRight,
  faSave, faCheck, faClock, faMapMarkerAlt, faEnvelope, faPhone,
  faImage, faFileAlt, faTags, faArchive, faStar, faHeart,
  faSignOutAlt, faUserCircle, faExternalLinkAlt, faBell, faChartLine,
  faExclamationTriangle, faCloudUploadAlt, faSpinner,
  faBold, faItalic, faStrikethrough, faListUl, faListOl, faQuoteRight,
  faLink, faUnlink, faUndo, faRedo,
  faCalendarCheck, faArrowLeft, faCheckCircle, faTimesCircle, faPoundSign, faExclamationCircle,
  faTh, faList, faPalette, faDownload, faShoppingBag, faSync, faLock, faMinus, faShieldAlt
} from '@fortawesome/free-solid-svg-icons'
import {
  faCalendar as faCalendarRegular,
  faClock as faClockRegular
} from '@fortawesome/free-regular-svg-icons'

// Add icons to library
library.add(
  faHome, faBox, faCalendar, faNewspaper, faShoppingCart, faUsers,
  faCog, faPlus, faEdit, faTrash, faSearch, faFilter, faEye,
  faBars, faTimes, faChevronDown, faChevronUp, faChevronLeft, faChevronRight,
  faSave, faCheck, faClock, faMapMarkerAlt, faEnvelope, faPhone,
  faImage, faFileAlt, faTags, faArchive, faStar, faHeart,
  faSignOutAlt, faUserCircle, faExternalLinkAlt, faBell, faChartLine,
  faExclamationTriangle, faCloudUploadAlt, faSpinner,
  faBold, faItalic, faStrikethrough, faListUl, faListOl, faQuoteRight,
  faLink, faUnlink, faUndo, faRedo,
  faCalendarCheck, faArrowLeft, faCheckCircle, faTimesCircle, faPoundSign, faExclamationCircle,
  faTh, faList, faPalette, faDownload, faShoppingBag, faSync, faLock, faMinus, faShieldAlt,
  faCalendarRegular, faClockRegular
)

const app = createApp(App)
const pinia = createPinia()

// Register Font Awesome component globally
app.component('font-awesome-icon', FontAwesomeIcon)

app.use(pinia)
app.use(router)

// Initialize auth store
const authStore = useAuthStore()
authStore.initialize()

app.mount('#app')
