<template>
  <BContainer fluid="xl">
    <page-title :title="$t('appPageTitle.serverPowerOperations')" />
    <BRow class="mb-4">
      <BCol sm="10">
        <page-section
          class="mb-0"
          :section-title="$t('pageServerPowerOperations.currentStatus')"
        >
          <BRow v-if="isInPhypStandby">
            <BCol>
              <alert variant="info">
                <span class="font-weight-bold">
                  {{ $t('pageServerPowerOperations.phypStandby') }}
                </span>
                <p class="mt-1">
                  {{ $t('pageServerPowerOperations.osRuntimeMessage') }}
                </p>
                <p>
                  {{ $t('pageServerPowerOperations.saveOsRuntimeMessage') }}
                </p>
                <p>
                  {{ $t('pageServerPowerOperations.discardOsRuntimeMessage') }}
                </p>
                <template #action>
                  <BButton
                    variant="link"
                    class="mt-3 d-flex justify-content-between align-items-center"
                    @click="standbyToRuntime"
                  >
                    <span class="pr-1">
                      {{ $t('pageServerPowerOperations.osRuntimeButton') }}
                    </span>
                    <icon-arrow-right />
                  </BButton>
                  <BButton
                    variant="link"
                    class="d-flex justify-content-between align-items-center"
                    @click="saveStandbyToRuntime"
                  >
                    <span class="pr-1">
                      {{ $t('pageServerPowerOperations.saveOsRuntimeButton') }}
                    </span>
                    <icon-arrow-right />
                  </BButton>
                  <BButton
                    variant="link"
                    class="d-flex justify-content-between align-items-center"
                    @click="discardStandbyToRuntime"
                  >
                    <span class="pr-1">
                      {{
                        $t('pageServerPowerOperations.discardOsRuntimeButton')
                      }}
                    </span>
                    <icon-arrow-right />
                  </BButton>
                </template>
              </alert>
            </BCol>
          </BRow>
          <div v-if="!isInPhypStandby" class="form-background pt-3 pl-3">
            <BRow>
              <BCol sm="3">
                <dl>
                  <dt>{{ $t('pageServerPowerOperations.serverStatus') }}</dt>
                  <dd
                    v-if="serverStatus === 'on'"
                    data-test-id="powerServerOps-text-hostStatus"
                  >
                    {{ $t('global.status.on') }}
                  </dd>
                  <dd
                    v-else-if="serverStatus === 'off'"
                    data-test-id="powerServerOps-text-hostStatus"
                  >
                    {{ $t('global.status.off') }}
                  </dd>
                  <dd v-else>
                    {{ $t('global.status.notAvailable') }}
                  </dd>
                </dl>
              </BCol>
              <BCol>
                <dl>
                  <dt>
                    {{ $t('pageServerPowerOperations.lastPowerOperation') }}
                  </dt>
                  <dd
                    v-if="lastPowerOperationTime"
                    data-test-id="powerServerOps-text-lastPowerOp"
                  ></dd>
                  <dd v-else>--</dd>
                </dl>
              </BCol>
            </BRow>
          </div>
        </page-section>
      </BCol>
    </BRow>
    <BRow>
      <BCol>
        <page-section
          :section-title="$t('pageServerPowerOperations.operations')"
        >
          <template v-if="isOperationInProgress">
            <alert variant="info">
              {{ $t('pageServerPowerOperations.operationInProgress') }}
            </alert>
          </template>
          <template v-else-if="serverStatus === 'off'">
            <b-button
              variant="primary"
              data-test-id="serverPowerOperations-button-powerOn"
              @click="powerOn"
            >
              {{ $t('pageServerPowerOperations.powerOn') }}
            </b-button>
          </template>
          <template v-else>
            <BRow>
              <BCol sm="5">
                <!-- Reboot server -->
                <BForm novalidate class="mb-5" @submit.prevent="rebootServer">
                  <BFormGroup>
                    <label for="orderly-reboot">{{
                      $t('pageServerPowerOperations.rebootServer')
                    }}</label>
                    <div id="orderly-reboot">
                      {{ $t('pageServerPowerOperations.orderlyReboot') }}
                    </div>
                  </BFormGroup>
                  <BButton
                    variant="primary"
                    type="submit"
                    data-test-id="serverPowerOperations-button-reboot"
                  >
                    {{ $t('pageServerPowerOperations.reboot') }}
                  </BButton>
                </BForm>
              </BCol>
              <!-- Shutdown server options -->
              <BCol sm="5">
                <BForm novalidate @submit.prevent="shutdownServer">
                  <BFormGroup
                    :label="$t('pageServerPowerOperations.shutdownServer')"
                  >
                    <BFormRadio
                      v-model="form.shutdownOption"
                      name="shutdown-option"
                      data-test-id="serverPowerOperations-radio-shutdownOrderly"
                      value="orderly"
                    >
                      {{ $t('pageServerPowerOperations.orderlyShutdown') }}
                    </BFormRadio>
                    <BFormRadio
                      v-model="form.shutdownOption"
                      name="shutdown-option"
                      data-test-id="serverPowerOperations-radio-shutdownImmediate"
                      value="immediate"
                    >
                      {{ $t('pageServerPowerOperations.immediateShutdown') }}
                    </BFormRadio>
                  </BFormGroup>
                  <BButton
                    variant="primary"
                    type="submit"
                    data-test-id="serverPowerOperations-button-shutDown"
                  >
                    {{ $t('pageServerPowerOperations.shutDown') }}
                  </BButton>
                </BForm>
              </BCol>
            </BRow>
          </template>
        </page-section>
      </BCol>
    </BRow>
    <BRow>
      <BCol sm="8" md="7" lg="7" xl="9">
        <page-section
          :section-title="$t('pageServerPowerOperations.serverBootSettings')"
        >
          <BRow class="mt-3 mb-3">
            <BCol>
              <BButton
                v-if="isInPhypStandby && hmcInfo !== 'Enabled' && isIBMi"
                variant="primary"
                data-test-id="network-settings"
                @click="openNetworkSettings"
              >
                {{ 'Network settings' }}
              </BButton>
              <alert v-else variant="info">
                {{ $t('pageServerPowerOperations.modal.alert.available') }}
              </alert>
            </BCol>
          </BRow>
          <!-- <boot-settings
            :is-in-phyp-standby="isInPhypStandby"
            :is-updated="isUpdated"
            @update-standby="updateToRuntime()"
          /> -->
        </page-section>
      </BCol>
    </BRow>

    <!-- Modal -->
    <!-- <network-settings-modal /> -->
  </BContainer>
</template>

<script setup>
import { ref, computed, onBeforeMount } from 'vue';
import eventBus from '@/eventBus';
import i18n from '@/i18n';
import { onBeforeRouteLeave } from 'vue-router';
import useLoadingBar from '@/components/Composables/useLoadingBarComposable';
import useToast from '@/components/Composables/useToastComposable';
import PageTitle from '@/components/Global/PageTitle.vue';
import PageSection from '@/components/Global/PageSection.vue';
// import BootSettings from './BootSettings';
import Alert from '@/components/Global/Alert.vue';
import ArrowRight16 from '@carbon/icons-vue/es/arrow--right/16';
// import NetworkSettingsModal from './NetworkSettingsModal';
import {
  GlobalStore,
  ControlStore,
  BmcStore,
  BootSettingsStore,
  ResourceMemoryStore,
} from '@/store';

const { startLoader, endLoader, hideLoader } = useLoadingBar();
const { infoToast, errorToast } = useToast();

const globalStore = GlobalStore();
const controlStore = ControlStore();
const bmcStore = BmcStore();
const bootSettingsStore = BootSettingsStore();
const resourceMemoryStore = ResourceMemoryStore();

const phypStandby = ref(false);
const isUpdated = ref(false);
const form = ref({
  rebootOption: 'orderly',
  shutdownOption: 'orderly',
});

const isInPhypStandby = computed(() => {
  if (!phypStandby.value) {
    const bootProgress = globalStore.bootProgressGetter;
    if (bootProgress === 'SystemHardwareInitializationComplete') {
      return true;
    } else {
      return false;
    }
  } else return false;
});

const bmc = computed(() => {
  return bmcStore.bmcGetter;
});

const hmcInfo = computed(() => {
  return globalStore.hmcManagedGetter;
});

const isIBMi = computed(() => {
  if (
    attributeKeys.value?.pvm_default_os_type === 'Default' ||
    attributeKeys.value?.pvm_default_os_type === 'IBM I'
  ) {
    return true;
  } else {
    return false;
  }
});

const attributeKeys = computed(() => {
  return bootSettingsStore.getBiosAttributes;
});

const serverStatus = computed(() => {
  return globalStore.serverStatusGetter;
});

const isOperationInProgress = computed(() => {
  controlStore.getIsOperationInProgress;
});

const lastPowerOperationTime = computed(() => {
  return controlStore.getLastPowerOperationTime;
});

const systemDumpActive = computed(() => {
  return bootSettingsStore.getSystemDumpActive;
});

// ----->>>>>>>> Pending
function openNetworkSettings() {
  // ----->>>>>>>> Pending
}

function discardStandbyToRuntime() {
  getRequiredResponses();
}

function saveStandbyToRuntime() {
  isUpdated.value = true;
}

function updateToRuntime() {
  isUpdated.value = false;
  standbyToRuntime();
}

function getRequiredResponses() {
  startLoader();
  Promise.all([
    bootSettingsStore.getOperatingModeSettings(),
    controlStore.fetchLastPowerOperationTime(),
    bmcStore.getBmcInfo(),
    globalStore.getBootProgress(),
    bootSettingsStore.fetchLocationCodes(),
    resourceMemoryStore.getHmcManaged(),
    bootSettingsStore.fetchBiosAttributes(),
    bootSettingsStore.fetchAttributeValues(),
  ]).finally(() => {
    endLoader();
    standbyToRuntime();
  });
}

function powerOn() {
  if (
    bmc.value.powerState === 'On' &&
    bmc.value.statusState === 'Enabled' &&
    bmc.value.health === 'OK'
  ) {
    controlStore
      .serverPowerOn()
      .then((response) => {
        if (response === true) {
          infoToast(i18n.global.t('pageServerPowerOperations.userRefresh'));
        }
      })
      .catch((error) => {
        console.log(error);
      });
  } else {
    errorToast(i18n.global.t('pageServerPowerOperations.toast.errorPowerOn'));
  }
}

// ****************************************************

// Pending:

function rebootServer() {}

function shutdownServer() {}

// ****************************************************

function standbyToRuntime() {
  bootSettingsStore
    .standbyToRuntime()
    .then((message) => {
      phypStandby.value = true;
      successToast(message);
    })
    .catch(({ message }) => errorToast(message));
}

onBeforeRouteLeave(() => {
  hideLoader();
});

onBeforeMount(() => {
  startLoader();
  const bootSettingsPromise = new Promise((resolve) => {
    eventBus.on('server-power-operations-boot-settings-complete', () =>
      resolve()
    );
  });
  Promise.all([
    bootSettingsStore.getOperatingModeSettings(),
    controlStore.fetchLastPowerOperationTime(),
    bmcStore.getBmcInfo(),
    globalStore.getBootProgress(),
    // bootSettingsPromise,  ----->> Pending
  ]).finally(() => endLoader());
});

// export default {
//   name: 'ServerPowerOperations',
//   components: {
//     PageTitle,
//     PageSection,
//     BootSettings,
//     Alert,
//     IconArrowRight: ArrowRight16,
//     NetworkSettingsModal,
//   },
//   mixins: [BVToastMixin, LoadingBarMixin],
//   beforeRouteLeave(to, from, next) {
//     this.hideLoader();
//     next();
//   },
//   data() {
//     return {
//       phypStandby: false,
//       isUpdated: false,
//       form: {
//         rebootOption: 'orderly',
//         shutdownOption: 'orderly',
//       },
//     };
//   },
//   computed: {
//     isInPhypStandby() {
//       if (!this.phypStandby) {
//         const bootProgress = this.$store.getters['global/bootProgress'];
//         if (bootProgress === 'SystemHardwareInitializationComplete') {
//           return true;
//         } else {
//           return false;
//         }
//       } else return false;
//     },
//     bmc() {
//       return this.$store.getters['bmc/bmc'];
//     },
//     hmcInfo() {
//       return this.$store?.getters['global/hmcManaged'];
//     },
//     isIBMi() {
//       if (
//         this.attributeKeys?.pvm_default_os_type === 'Default' ||
//         this.attributeKeys?.pvm_default_os_type === 'IBM I'
//       ) {
//         return true;
//       } else {
//         return false;
//       }
//     },
//     attributeKeys() {
//       return this.$store.getters['serverBootSettings/biosAttributes'];
//     },
//     serverStatus() {
//       return this.$store.getters['global/serverStatus'];
//     },
//     isOperationInProgress() {
//       return this.$store.getters['controls/isOperationInProgress'];
//     },
//     lastPowerOperationTime() {
//       return this.$store.getters['controls/lastPowerOperationTime'];
//     },
//     oneTimeBootEnabled() {
//       return this.$store.getters['serverBootSettings/overrideEnabled'];
//     },
//     systemDumpActive() {
//       return this.$store?.getters['serverBootSettings/systemDumpActive'];
//     },
//   },
//   created() {
//     this.startLoader();
//     const bootSettingsPromise = new Promise((resolve) => {
//       this.$root.$on('server-power-operations-boot-settings-complete', () =>
//         resolve()
//       );
//     });
//     Promise.all([
//       this.$store.dispatch('serverBootSettings/getOperatingModeSettings'),
//       this.$store.dispatch('controls/getLastPowerOperationTime'),
//       this.$store.dispatch('bmc/getBmcInfo'),
//       this.$store.dispatch('global/getBootProgress'),
//       bootSettingsPromise,
//     ]).finally(() => this.endLoader());
//   },
//   methods: {
//     openNetworkSettings() {
//       this.$bvModal.show('modal-network-settings');
//     },
//     discardStandbyToRuntime() {
//       this.getRequiredResponses();
//     },
//     saveStandbyToRuntime() {
//       this.isUpdated = true;
//     },
//     updateToRuntime() {
//       this.isUpdated = false;
//       this.standbyToRuntime();
//     },
//     getRequiredResponses() {
//       this.startLoader();
//       Promise.all([
//         this.$store.dispatch('serverBootSettings/getOperatingModeSettings'),
//         this.$store.dispatch('controls/getLastPowerOperationTime'),
//         this.$store.dispatch('bmc/getBmcInfo'),
//         this.$store.dispatch('global/getBootProgress'),
//         this.$store.dispatch('serverBootSettings/getLocationCodes'),
//         this.$store.dispatch('resourceMemory/getHmcManaged'),
//         this.$store.dispatch('serverBootSettings/getBiosAttributes'),
//         this.$store.dispatch('serverBootSettings/getAttributeValues'),
//       ]).finally(() => {
//         this.endLoader();
//         this.standbyToRuntime();
//       });
//     },
//     powerOn() {
//       if (
//         this.bmc.powerState === 'On' &&
//         this.bmc.statusState === 'Enabled' &&
//         this.bmc.health === 'OK'
//       ) {
//         this.$store
//           .dispatch('controls/serverPowerOn')
//           .then((response) => {
//             if (response === true) {
//               this.infoToast(this.$t('pageServerPowerOperations.userRefresh'));
//             }
//           })
//           .catch((error) => {
//             console.log(error);
//           });
//       } else {
//         this.errorToast(
//           this.$t('pageServerPowerOperations.toast.errorPowerOn')
//         );
//       }
//     },
//     rebootServer() {
//       this.$store.dispatch('serverBootSettings/getBiosAttributes').then(() => {
//         const modalMessage = `${
//           this.systemDumpActive
//             ? this.$t('pageServerPowerOperations.modal.confirmRebootMessage2')
//             : ''
//         } ${this.$t('pageServerPowerOperations.modal.confirmRebootMessage')}`;
//         const modalOptions = {
//           title: this.$t('pageServerPowerOperations.modal.confirmRebootTitle'),
//           okVariant: this.systemDumpActive ? 'danger' : 'primary',
//           okTitle: this.systemDumpActive
//             ? this.$t('pageServerPowerOperations.reboot')
//             : this.$t('global.action.confirm'),
//           cancelTitle: this.$t('global.action.cancel'),
//         };

//         if (this.form.rebootOption === 'orderly') {
//           this.$bvModal
//             .msgBoxConfirm(modalMessage, modalOptions)
//             .then((confirmed) => {
//               if (confirmed) {
//                 this.$store
//                   .dispatch('controls/serverSoftReboot')
//                   .then((response) => {
//                     if (response === true) {
//                       this.infoToast(
//                         this.$t('pageServerPowerOperations.userRefresh')
//                       );
//                     }
//                   })
//                   .catch((error) => {
//                     console.log(error);
//                   });
//               }
//             });
//         } else if (this.form.rebootOption === 'immediate') {
//           this.$bvModal
//             .msgBoxConfirm(modalMessage, modalOptions)
//             .then((confirmed) => {
//               if (confirmed) {
//                 this.$store
//                   .dispatch('controls/serverHardReboot')
//                   .then((response) => {
//                     if (response === true) {
//                       this.infoToast(
//                         this.$t('pageServerPowerOperations.userRefresh')
//                       );
//                     }
//                   })
//                   .catch((error) => {
//                     console.log(error);
//                   });
//               }
//             });
//         }
//       });
//     },
//     shutdownServer() {
//       const modalMessage = `${
//         this.systemDumpActive
//           ? this.$t('pageServerPowerOperations.modal.confirmShutdownMessage2')
//           : ''
//       } ${this.$t('pageServerPowerOperations.modal.confirmShutdownMessage')}`;
//       const modalOptions = {
//         title: this.$t('pageServerPowerOperations.modal.confirmShutdownTitle'),
//         okTitle: this.systemDumpActive
//           ? this.$t('pageServerPowerOperations.shutDown')
//           : this.$t('global.action.confirm'),
//         okVariant: this.systemDumpActive ? 'danger' : 'primary',
//         cancelTitle: this.$t('global.action.cancel'),
//       };

//       if (this.form.shutdownOption === 'orderly') {
//         this.$bvModal
//           .msgBoxConfirm(modalMessage, modalOptions)
//           .then((confirmed) => {
//             if (confirmed) {
//               this.$store
//                 .dispatch('controls/serverSoftPowerOff')
//                 .then((response) => {
//                   if (response === true) {
//                     this.infoToast(
//                       this.$t('pageServerPowerOperations.userRefresh')
//                     );
//                   }
//                 })
//                 .catch((error) => {
//                   console.log(error);
//                 });
//             }
//           });
//       }
//       if (this.form.shutdownOption === 'immediate') {
//         this.$bvModal
//           .msgBoxConfirm(modalMessage, modalOptions)
//           .then((confirmed) => {
//             if (confirmed) {
//               this.$store
//                 .dispatch('controls/serverHardPowerOff')
//                 .then((response) => {
//                   if (response === true) {
//                     this.infoToast(
//                       this.$t('pageServerPowerOperations.userRefresh')
//                     );
//                   }
//                 })
//                 .catch((error) => {
//                   console.log(error);
//                 });
//             }
//           });
//       }
//     },
//     standbyToRuntime() {
//       this.$store
//         .dispatch('serverBootSettings/standbyToRuntime')
//         .then((message) => {
//           this.phypStandby = true;
//           this.isInPhypStandby;
//           this.successToast(message);
//         })
//         .catch(({ message }) => this.errorToast(message));
//     },
//   },
// };
</script>
