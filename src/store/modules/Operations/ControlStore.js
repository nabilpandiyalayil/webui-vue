import api from '@/store/api';
import i18n from '@/i18n';

import { defineStore } from 'pinia';
import { GlobalStore } from '@/store/modules/GlobalStore.js';

/**
 * Watch for serverStatus changes in GlobalStore module
 * to set isOperationInProgress state
 * Stop watching status changes and resolve Promise when
 * serverStatus value matches passed argument or after 5 minutes
 * @param {string} serverStatus
 * @returns {Promise}
 */
// const checkForServerStatus = function (serverStatus) {
//   return new Promise((resolve) => {
//     const timer = setTimeout(() => {
//       resolve();
//       unwatch();
//     }, 300000 /*5mins*/);
//     const unwatch = this.watch(
//       (state) => state.global.serverStatus,
//       (value) => {
//         if (value === serverStatus) {
//           resolve();
//           unwatch();
//           clearTimeout(timer);
//         }
//       },
//     );
//   });
// };

export const ControlStore = defineStore('control', {
  state: () => ({
    isOperationInProgress: false,
    lastPowerOperationTime: null,
    lastBmcRebootTime: null,
    rand: 0,
  }),
  getters: {
    getIsOperationInProgress: (state) => state.isOperationInProgress,
    getLastPowerOperationTime: (state) => state.lastPowerOperationTime,
    getLastBmcRebootTime: (state) => state.lastBmcRebootTime,
  },
  actions: {
    /**
     * Watch for serverStatus changes in GlobalStore module
     * to set isOperationInProgress state
     * Stop watching status changes and resolve Promise when
     * serverStatus value matches passed argument or after 5 minutes
     * @param {string} serverStatus
     * @returns {Promise}
     */
    async checkForServerStatus(serverStatus) {
      const global = GlobalStore();
      return new Promise((resolve) => {
        const timer = setTimeout(() => {
          resolve();
          removeSub();
        }, 300000 /*5mins*/);
        const removeSub = global.$subscribe(
          ({ events }) => {
            if (
              events.key === 'serverStatus' &&
              events.newValue === serverStatus
            ) {
              resolve();
              removeSub();
              clearTimeout(timer);
            }
          },
          { detached: true },
        );
      });
    },
    async fetchLastPowerOperationTime() {
      return await api
        .get('/redfish/v1/Systems/system')
        .then((response) => {
          const lastReset = response.data.LastResetTime;
          if (lastReset) {
            const lastPowerOperationTime = new Date(lastReset);
            this.lastPowerOperationTime = lastPowerOperationTime;
          }
        })
        .catch((error) => console.log(error));
    },
    fetchLastBmcRebootTime() {
      return api
        .get('/redfish/v1/Managers/bmc')
        .then((response) => {
          const lastBmcReset = response.data.LastResetTime;
          const lastBmcRebootTime = new Date(lastBmcReset);
          this.lastBmcRebootTime = lastBmcRebootTime;
        })
        .catch((error) => console.log(error));
    },
    async rebootBmc() {
      const data = { ResetType: 'GracefulRestart' };
      return await api
        .post('/redfish/v1/Managers/bmc/Actions/Manager.Reset', data)
        .then(() => this.fetchLastBmcRebootTime())
        .then(() => i18n.global.t('pageRebootBmc.toast.successRebootStart'))
        .catch((error) => {
          console.log(error);
          throw new Error(
            i18n.global.t('pageRebootBmc.toast.errorRebootStart'),
          );
        });
    },
    async serverPowerOn() {
      const data = { ResetType: 'On' };
      this.serverPowerChange(data);
      await this.checkForServerStatus('on');
      this.isOperationInProgress = false;
      this.fetchLastPowerOperationTime();
    },
    async serverSoftReboot() {
      const data = { ResetType: 'GracefulRestart' };
      this.serverPowerChange(data);
      await this.checkForServerStatus('on');
      this.isOperationInProgress = false;
      this.fetchLastPowerOperationTime();
    },
    async serverHardReboot() {
      const data = { ResetType: 'ForceRestart' };
      this.serverPowerChange(data);
      await this.checkForServerStatus('on');
      this.isOperationInProgress = false;
      this.fetchLastPowerOperationTime();
    },
    async serverSoftPowerOff() {
      const data = { ResetType: 'GracefulShutdown' };
      this.serverPowerChange(data);
      await this.checkForServerStatus('off');
      this.isOperationInProgress = false;
      this.fetchLastPowerOperationTime();
    },
    async serverHardPowerOff() {
      const data = { ResetType: 'ForceOff' };
      this.serverPowerChange(data);
      await this.checkForServerStatus('off');
      this.isOperationInProgress = false;
      this.fetchLastPowerOperationTime();
    },
    serverPowerChange(data) {
      this.isOperationInProgress = true;
      api
        .post('/redfish/v1/Systems/system/Actions/ComputerSystem.Reset', data)
        .catch((error) => {
          console.log(error);
          this.isOperationInProgress = false;
        });
    },
  },
});

export default ControlStore;
