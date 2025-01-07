//TODO: Work Requird -->
import api from '@/store/api';
import i18n from '@/i18n';
import { defineStore } from 'pinia';
import { find } from 'lodash';

export const NetworkStore = defineStore('network', {
  state: () => ({
    dhcpEnabledState: false,
    ipv6DhcpEnabledState: false,
    ipv6AutoConfigEnabled: false,
    networkSettings: [],
    selectedInterfaceId: '', // which tab is selected
    selectedInterfaceIndex: 0, // which tab is selected
    isTableBusy: false,
  }),
  getters: {
    dhcpEnabledStateGetter: (state) => state.dhcpEnabledState,
    ipv6DhcpEnabledStateGetter: (state) => state.ipv6DhcpEnabledState,
    ipv6AutoConfigEnabledGetter: (state) => state.ipv6AutoConfigEnabled,
    networkSettingsGetter: (state) => state.networkSettings,
    selectedInterfaceIdGetter: (state) => state.selectedInterfaceId,
    selectedInterfaceIndexGetter: (state) => state.selectedInterfaceIndex,
    isTableBusyGetter: (state) => state.isTableBusy,
  },
  actions: {
    setNetworkSettings: (data) => {
      this.networkSettings = data.map(({ data }) => {
        const {
          DHCPv4,
          DHCPv6,
          HostName,
          Id,
          IPv4Addresses,
          IPv4StaticAddresses,
          IPv6StaticAddresses,
          IPv6Addresses,
          IPv6DefaultGateway,
          IPv6StaticDefaultGateways,
          MACAddress,
          StaticNameServers,
          StatelessAddressAutoConfig,
        } = data;
        return {
          defaultGateway: IPv4StaticAddresses[0]?.Gateway, //First static gateway is the default gateway
          dhcpAddress: IPv4Addresses.filter(
            (ipv4) => ipv4.AddressOrigin === 'DHCP'
          ),
          dhcpEnabled: DHCPv4.DHCPEnabled,
          hostname: HostName,
          id: Id,
          ipv4: IPv4Addresses,
          macAddress: MACAddress,
          staticAddress: IPv4StaticAddresses[0]?.Address, // Display first static address on overview page
          staticIpv4Addresses: IPv4StaticAddresses,
          staticNameServers: StaticNameServers,
          useDnsEnabled: DHCPv4.UseDNSServers,
          useDomainNameEnabled: DHCPv4.UseDomainName,
          useNtpEnabled: DHCPv4.UseNTPServers,
          staticIpv6Addresses: IPv6StaticAddresses ?? [],
          ipv6: IPv6Addresses ?? [],
          ipv6DefaultGateway: IPv6DefaultGateway ?? '',
          ipv6OperatingMode: DHCPv6?.OperatingMode ?? '',
          ipv6StaticDefaultGateways: IPv6StaticDefaultGateways ?? [],
          ipv6UseDnsEnabled: DHCPv6?.UseDNSServers ?? false,
          ipv6UseDomainNameEnabled: DHCPv6?.UseDomainName ?? false,
          ipv6UseNtpEnabled: DHCPv6?.UseNTPServers ?? false,
          ipv6AutoConfigEnabled:
            StatelessAddressAutoConfig?.IPv6AutoConfigEnabled ?? false,
        };
      });
    },
    async getEthernetData() {
      return await api
        .get('/redfish/v1/Managers/bmc/EthernetInterfaces')
        .then((response) =>
          response.data.Members.map(
            (ethernetInterface) => ethernetInterface['@odata.id']
          )
        )
        .then((ethernetInterfaceIds) =>
          api.all(
            ethernetInterfaceIds.map((ethernetInterface) =>
              api.get(ethernetInterface)
            )
          )
        )
        .then((ethernetInterfaces) => {
          const ethernetData = ethernetInterfaces.map(
            (ethernetInterface) => ethernetInterface.data
          );

          this.setNetworkSettings(ethernetInterfaces);
          let currentInterfaceIndex = 0;
          if (this.selectedInterfaceIndex) {
            currentInterfaceIndex = this.selectedInterfaceIndex;
          }
          this.selectedInterfaceId = ethernetData[currentInterfaceIndex].Id;
        })
        .catch((error) => {
          console.log('Network Data:', error);
        });
    },
    async getEthernetDataAfterDelay() {
      this.isTableBusy = true;
      setTimeout(() => {
        this.getEthernetData();
      }, 10000);
      setTimeout(() => {
        this.isTableBusy = false;
      }, 15000);
    },
    async saveDomainNameState(domainState) {
      this.domainState = domainState;
      const data = {
        DHCPv4: {
          UseDomainName: domainState,
        },
      };
      return api
        .patch(
          `/redfish/v1/Managers/bmc/EthernetInterfaces/${this.selectedInterfaceId}`,
          data
        )
        .then(this.getEthernetData())
        .then(() => {
          return i18n.global.t('pageNetwork.toast.successSaveNetworkSettings', {
            setting: i18n.global.t('pageNetwork.domainName'),
          });
        })
        .catch((error) => {
          console.log(error);
          this.domainState = !domainState;
          throw new Error(
            i18n.global.t('pageNetwork.toast.errorSaveNetworkSettings', {
              setting: i18n.global.t('pageNetwork.domainName'),
            })
          );
        });
    },
    async saveDnsState(dnsState) {
      this.dnsState = dnsState;
      const data = {
        DHCPv4: {
          UseDNSServers: dnsState,
        },
      };
      return api
        .patch(
          `/redfish/v1/Managers/bmc/EthernetInterfaces/${this.selectedInterfaceId}`,
          data
        )
        .then(this.getEthernetData())
        .then(() => {
          return i18n.global.t('pageNetwork.toast.successSaveNetworkSettings', {
            setting: i18n.global.t('pageNetwork.dns'),
          });
        })
        .catch((error) => {
          console.log(error);
          this.dnsState = !dnsState;
          throw new Error(
            i18n.global.t('pageNetwork.toast.errorSaveNetworkSettings', {
              setting: i18n.global.t('pageNetwork.dns'),
            })
          );
        });
    },
    async saveNtpState(ntpState) {
      this.ntpState = ntpState;
      const data = {
        DHCPv4: {
          UseNTPServers: ntpState,
        },
      };
      return api
        .patch(
          `/redfish/v1/Managers/bmc/EthernetInterfaces/${this.selectedInterfaceId}`,
          data
        )
        .then(this.getEthernetData())
        .then(() => {
          return i18n.global.t('pageNetwork.toast.successSaveNetworkSettings', {
            setting: i18n.global.t('pageNetwork.ntp'),
          });
        })
        .catch((error) => {
          console.log(error);
          this.ntpState = !ntpState;
          throw new Error(
            i18n.global.t('pageNetwork.toast.errorSaveNetworkSettings', {
              setting: i18n.global.t('pageNetwork.ntp'),
            })
          );
        });
    },
    async saveDhcpEnabledState(dhcpState) {
      this.dhcpEnabledState = dhcpState;
      const data = {
        DHCPv4: {
          DHCPEnabled: dhcpState,
        },
      };
      return api
        .patch(
          `/redfish/v1/Managers/bmc/EthernetInterfaces/${this.selectedInterfaceId}`,
          data
        )
        .then(() => {
          // Getting Ethernet data here so that the toggle gets updated
          this.getEthernetData();
          // Getting Ethernet data here so that the IPv4 table gets updated
          this.getEthernetDataAfterDelay();
        })
        .then(() => {
          return i18n.global.t('pageNetwork.toast.successSaveNetworkSettings', {
            setting: i18n.global.t('pageNetwork.dhcp'),
          });
        })
        .catch((error) => {
          console.log(error);
          this.dhcpEnabledState = !dhcpState;
          throw new Error(
            i18n.global.t('pageNetwork.toast.errorSaveNetworkSettings', {
              setting: i18n.global.t('pageNetwork.dhcp'),
            })
          );
        });
    },
    async saveIpv6DhcpEnabledState(dhcpState) {
      const updatedDhcpState = dhcpState ? 'Enabled' : 'Disabled';
      this.ipv6DhcpEnabledState = updatedDhcpState;
      const data = {
        DHCPv6: {
          OperatingMode: updatedDhcpState,
        },
      };
      return api
        .patch(
          `/redfish/v1/Managers/bmc/EthernetInterfaces/${this.selectedInterfaceId}`,
          data
        )
        .then(() => {
          // Getting Ethernet data here so that the toggle gets updated
          this.getEthernetData();
          // Getting Ethernet data here so that the IPv6 table gets updated
          this.getEthernetDataAfterDelay();
        })
        .then(() => {
          return i18n.global.t('pageNetwork.toast.successSaveNetworkSettings', {
            setting: i18n.global.t('pageNetwork.dhcp'),
          });
        })
        .catch((error) => {
          console.log(error);
          this.ipv6DhcpEnabledState = !dhcpState;
          throw new Error(
            i18n.global.t('pageNetwork.toast.errorSaveNetworkSettings', {
              setting: i18n.global.t('pageNetwork.dhcp'),
            })
          );
        });
    },
    async saveIpv6AutoConfigState(ipv6AutoConfigState) {
      this.ipv6AutoConfigEnabled = ipv6AutoConfigState;
      const data = {
        StatelessAddressAutoConfig: {
          IPv6AutoConfigEnabled: ipv6AutoConfigState,
        },
      };
      return api
        .patch(
          `/redfish/v1/Managers/bmc/EthernetInterfaces/${this.selectedInterfaceId}`,
          data
        )
        .then(() => {
          // Getting Ethernet data here so that the toggle gets updated
          this.getEthernetData();
          // Getting Ethernet data here so that the IPv6 table gets updated
          this.getEthernetDataAfterDelay();
        })
        .then(() => {
          return i18n.global.t('pageNetwork.toast.successSaveNetworkSettings', {
            setting: i18n.global.t('pageNetwork.ipv6AutoConfig'),
          });
        })
        .catch((error) => {
          console.log(error);
          this.ipv6AutoConfigEnabled = !ipv6AutoConfigState;
          throw new Error(
            i18n.global.t('pageNetwork.toast.errorSaveNetworkSettings', {
              setting: i18n.global.t('pageNetwork.ipv6AutoConfig'),
            })
          );
        });
    },
    async setSelectedTabIndex(tabIndex) {
      this.selectedInterfaceIndex = tabIndex;
    },
    async setSelectedTabId(tabId) {
      this.selectedInterfaceId = tabId;
    },
    async updateIpv4Address(newIpv4Address) {
      const originalAddresses =
        this.networkSettings[this.selectedInterfaceIndex].staticIpv4Addresses;
      const updatedIpv4 = originalAddresses.map((item) => {
        const address = item.Address;
        if (find(newIpv4Address, { Address: address })) {
          return null; // if address matches then delete address to "edit"
        } else {
          return {}; // if address doesn't match then skip address, no change
        }
      });
      const filteredAddress = newIpv4Address.filter(
        (item) => item.Subnet !== ''
      );
      const updatedIpv4Array = {
        IPv4StaticAddresses: [...updatedIpv4, ...filteredAddress],
      };
      return api
        .patch(
          `/redfish/v1/Managers/bmc/EthernetInterfaces/${this.selectedInterfaceId}`,
          updatedIpv4Array
        )
        .then(() => {
          this.getEthernetDataAfterDelay();
        })
        .then(() => {
          return i18n.global.t('pageNetwork.toast.successSaveNetworkSettings', {
            setting: i18n.global.t('pageNetwork.ipv4'),
          });
        })
        .catch((error) => {
          console.log(error);
          throw new Error(
            i18n.global.t('pageNetwork.toast.errorSaveNetworkSettings', {
              setting: i18n.global.t('pageNetwork.ipv4'),
            })
          );
        });
    },
    async updateIpv6Address(newIpv6Address) {
      const originalAddresses =
        this.networkSettings[this.selectedInterfaceIndex].staticIpv6Addresses;
      const updatedIpv6 = originalAddresses.map((item) => {
        const address = item.Address;
        if (find(newIpv6Address, { Address: address })) {
          return null; // if address matches then delete address to "edit"
        } else {
          return {}; // if address doesn't match then skip address, no change
        }
      });
      const filteredAddress = newIpv6Address.filter(
        (item) => item.PrefixLength !== 0
      );
      const updatedIpv6Array = {
        IPv6StaticAddresses: [...updatedIpv6, ...filteredAddress],
      };
      return api
        .patch(
          `/redfish/v1/Managers/bmc/EthernetInterfaces/${this.selectedInterfaceId}`,
          updatedIpv6Array
        )
        .then(() => {
          this.getEthernetDataAfterDelay();
        })
        .then(() => {
          return i18n.globalt('pageNetwork.toast.successSaveNetworkSettings', {
            setting: i18n.global.t('pageNetwork.ipv6'),
          });
        })
        .catch((error) => {
          console.log(error);
          throw new Error(
            i18n.global.t('pageNetwork.toast.errorSaveNetworkSettings', {
              setting: i18n.global.t('pageNetwork.ipv6'),
            })
          );
        });
    },
    async updateIpv6StaticDefaultGatewayAddress(
      newIpv6StaticDefaultGatewayAddress
    ) {
      const originalAddresses =
        this.networkSettings[this.selectedInterfaceIndex]
          .ipv6StaticDefaultGateways;
      const updatedIpv6 = originalAddresses.map((item) => {
        const address = item.Address;
        if (find(newIpv6StaticDefaultGatewayAddress, { Address: address })) {
          return null; // if address matches then delete address to "edit"
        } else {
          return {}; // if address doesn't match then skip address, no change
        }
      });
      const filteredAddress = newIpv6StaticDefaultGatewayAddress.filter(
        (item) => item.PrefixLength !== 0
      );
      const updatedIpv6Array = {
        IPv6StaticDefaultGateways: [...updatedIpv6, ...filteredAddress],
      };
      return api
        .patch(
          `/redfish/v1/Managers/bmc/EthernetInterfaces/${this.selectedInterfaceId}`,
          updatedIpv6Array
        )
        .then(() => {
          this.getEthernetDataAfterDelay();
        })
        .then(() => {
          return i18n.global.t('pageNetwork.toast.successSaveNetworkSettings', {
            setting: i18n.global.t('pageNetwork.ipv6StaticDefaultGateway'),
          });
        })
        .catch((error) => {
          console.log(error);
          throw new Error(
            i18n.global.t('pageNetwork.toast.errorSaveNetworkSettings', {
              setting: i18n.global.t('pageNetwork.ipv6StaticDefaultGateway'),
            })
          );
        });
    },
    async deleteIpv4Address(updatedIpv4Array) {
      const originalAddressArray =
        this.networkSettings[this.selectedInterfaceIndex].staticIpv4Addresses;
      const newIpv4Array = originalAddressArray.map((item) => {
        const address = item.Address;
        if (find(updatedIpv4Array, { Address: address })) {
          return {}; //return addresses that match the updated array
        } else {
          return null; // delete address that do not match updated array
        }
      });

      return api
        .patch(
          `/redfish/v1/Managers/bmc/EthernetInterfaces/${this.selectedInterfaceId}`,
          { IPv4StaticAddresses: newIpv4Array }
        )
        .then(() => {
          // Getting Ethernet data here so that the address is deleted immediately
          this.getEthernetData();
          // Getting Ethernet data here so that the IPv4 table gets updated
          this.getEthernetDataAfterDelay();
        })
        .then(() => {
          return i18n.global.t('pageNetwork.toast.successDeletingIpv4Server');
        })
        .catch((error) => {
          console.log(error);
          throw new Error(
            i18n.global.t('pageNetwork.toast.errorDeletingIpv4Server')
          );
        });
    },
    async deleteIpv6Address(updatedIpv6Array) {
      const originalAddressArray =
        this.networkSettings[this.selectedInterfaceIndex].staticIpv6Addresses;
      const newIpv6Array = originalAddressArray.map((item) => {
        const address = item.Address;
        if (find(updatedIpv6Array, { Address: address })) {
          return {}; //return addresses that match the updated array
        } else {
          return null; // delete address that do not match updated array
        }
      });
      return api
        .patch(
          `/redfish/v1/Managers/bmc/EthernetInterfaces/${this.selectedInterfaceId}`,
          { IPv6StaticAddresses: newIpv6Array }
        )
        .then(() => {
          // Getting Ethernet data here so that the address is deleted immediately
          this.getEthernetData();
          // Getting Ethernet data here so that the IPv6 table gets updated
          this.getEthernetDataAfterDelay();
        })
        .then(() => {
          return i18n.global.t('pageNetwork.toast.successDeletingIpv6Server');
        })
        .catch((error) => {
          console.log(error);
          throw new Error(
            i18n.global.t('pageNetwork.toast.errorDeletingIpv6Server')
          );
        });
    },
    async deleteIpv6StaticDefaultGatewayAddress(updatedIpv6Array) {
      const originalAddressArray =
        this.networkSettings[this.selectedInterfaceIndex]
          .ipv6StaticDefaultGateways;
      const newIpv6Array = originalAddressArray.map((item) => {
        const address = item.Address;
        if (find(updatedIpv6Array, { Address: address })) {
          return {}; //return addresses that match the updated array
        } else {
          return null; // delete address that do not match updated array
        }
      });
      return api
        .patch(
          `/redfish/v1/Managers/bmc/EthernetInterfaces/${this.selectedInterfaceId}`,
          { IPv6StaticDefaultGateways: newIpv6Array }
        )
        .then(() => {
          // Getting Ethernet data here so that the address is deleted immediately
          this.getEthernetData();
          // Getting Ethernet data here so that the table gets updated
          this.getEthernetDataAfterDelay();
        })
        .then(() => {
          return i18n.global.t(
            'pageNetwork.toast.successDeletingIpv6StaticDefaultGateway'
          );
        })
        .catch((error) => {
          console.log(error);
          throw new Error(
            i18n.global.t(
              'pageNetwork.toast.errorDeletingIpv6StaticDefaultGateway'
            )
          );
        });
    },
    async saveHostname(hostname) {
      return api
        .patch(
          `/redfish/v1/Managers/bmc/EthernetInterfaces/${this.selectedInterfaceId}`,
          hostname
        )
        .then(() => {
          return i18n.global.t('pageNetwork.toast.successSaveNetworkSettings', {
            setting: i18n.global.t('pageNetwork.network'),
          });
        })
        .catch((error) => {
          console.log(error);
          throw new Error(
            i18n.global.t('pageNetwork.toast.errorSaveNetworkSettings', {
              setting: i18n.global.t('pageNetwork.network'),
            })
          );
        });
    },
    async saveDnsAddress(dnsForm) {
      const newAddress = dnsForm;
      const originalAddresses =
        this.networkSettings[this.selectedInterfaceIndex].staticNameServers;
      const newDnsArray = originalAddresses.concat(newAddress);
      return api
        .patch(
          `/redfish/v1/Managers/bmc/EthernetInterfaces/${this.selectedInterfaceId}`,
          { StaticNameServers: newDnsArray }
        )
        .then(this.getEthernetData())
        .then(() => {
          return i18n.global.t('pageNetwork.toast.successAddingDnsServer');
        })
        .catch((error) => {
          console.log(error);
          throw new Error(
            i18n.global.t('pageNetwork.toast.errorAddingDnsServer')
          );
        });
    },
    async editDnsAddress(dnsTableData) {
      return api
        .patch(
          `/redfish/v1/Managers/bmc/EthernetInterfaces/${this.selectedInterfaceId}`,
          { StaticNameServers: dnsTableData }
        )
        .then(this.getEthernetData())
        .then(() => {
          return i18n.global.t('pageNetwork.toast.successDeletingDnsServer');
        })
        .catch((error) => {
          console.log(error);
          throw new Error(
            i18n.global.t('pageNetwork.toast.errorDeletingDnsServer')
          );
        });
    },
  },
});

export default NetworkStore;
