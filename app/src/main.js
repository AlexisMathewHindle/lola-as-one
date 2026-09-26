import { createApp } from 'vue'
import { createPinia } from 'pinia'
import router from './router'
import { useAuthStore } from './stores/auth'
import { useConsentStore } from './stores/consent'
import { initConsentedTags } from './lib/consentedTags'
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
  faTh, faList, faPalette, faDownload, faShoppingBag, faSync, faLock, faMinus, faShieldAlt,
  faBaby, faPaintBrush, faGift, faArrowDown, faArrowUp, faMugHot, faCakeCandles, faBookOpen, faCopy,
  faEllipsisVertical
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
  faBaby, faPaintBrush, faGift, faArrowDown, faArrowUp, faMugHot, faCakeCandles, faBookOpen, faCopy,
  faEllipsisVertical,
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

// Load any saved cookie-consent decision, then wire up the tag gate. Tags load
// only when the admin has enabled them AND the visitor has consented.
const consentStore = useConsentStore()
consentStore.initialize()
initConsentedTags()

app.mount('#app')
