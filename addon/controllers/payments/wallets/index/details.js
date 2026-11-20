import Controller from '@ember/controller';
import { inject as service } from '@ember/service';
import { action } from '@ember/object';

export default class PaymentsWalletsIndexDetailsController extends Controller {
    @service notifications;
    @service modalsManager;
    @service fetch;
    @service intl;

    get tabs() {
        return [
            { label: this.intl.t('literal.ledger.overview'), route: 'payments.wallets.index.details.index' },
            { label: this.intl.t('literal.ledger.transactions'), route: 'payments.wallets.index.details.transactions' },
        ];
    }

    get actionButtons() {
        const wallet = this.model;
        const frozen = wallet?.is_frozen;

        return [
            { label: this.intl.t('literal.ledger.add-funds'), icon: 'plus-circle', type: 'primary', helpText: this.intl.t('literal.ledger.add-funds-to-this-wallet-balance'), onClick: this.topUpWallet },
            { label: this.intl.t('literal.ledger.transfer'), icon: 'exchange-alt', helpText: this.intl.t('literal.ledger.transfer-funds-from-this-wallet-to-another-walle-7767e'), onClick: this.transferFunds },
            {
                label: frozen ? this.intl.t('literal.ledger.unfreeze') : this.intl.t('literal.ledger.freeze'),
                icon: frozen ? 'unlock' : 'lock',
                type: frozen ? 'default' : 'danger',
                helpText: frozen ? this.intl.t('literal.ledger.unfreeze-this-wallet-to-allow-debits') : this.intl.t('literal.ledger.freeze-this-wallet-to-block-all-debits'),
                onClick: frozen ? this.unfreezeWallet : this.freezeWallet,
            },
        ];
    }

    @action async freezeWallet() {
        const wallet = this.model;

        this.modalsManager.confirm({
            title: this.intl.t('literal.ledger.freeze-46d41', { name: wallet.name }),
            body: this.intl.t('literal.ledger.freezing-this-wallet-will-block-all-debit-transa-36ef8'),
            acceptButtonText: this.intl.t('literal.ledger.freeze-wallet'),
            acceptButtonIcon: 'lock',
            acceptButtonScheme: 'danger',
            confirm: async (modal) => {
                modal.startLoading();
                try {
                    await this.fetch.post(`wallets/${wallet.id}/freeze`, {}, { namespace: 'ledger/int/v1' });
                    this.notifications.success(this.intl.t('literal.ledger.has-been-frozen', { name: wallet.name }));
                    await wallet.reload();
                    modal.done();
                } catch (error) {
                    this.notifications.serverError(error);
                    modal.stopLoading();
                }
            },
        });
    }

    @action async unfreezeWallet() {
        const wallet = this.model;

        this.modalsManager.confirm({
            title: this.intl.t('literal.ledger.unfreeze-81780', { name: wallet.name }),
            body: this.intl.t('literal.ledger.unfreezing-this-wallet-will-restore-normal-opera-ebff5'),
            acceptButtonText: this.intl.t('literal.ledger.unfreeze-wallet'),
            acceptButtonIcon: 'unlock',
            confirm: async (modal) => {
                modal.startLoading();
                try {
                    await this.fetch.post(`wallets/${wallet.id}/unfreeze`, {}, { namespace: 'ledger/int/v1' });
                    this.notifications.success(this.intl.t('literal.ledger.has-been-unfrozen', { name: wallet.name }));
                    await wallet.reload();
                    modal.done();
                } catch (error) {
                    this.notifications.serverError(error);
                    modal.stopLoading();
                }
            },
        });
    }

    @action async topUpWallet() {
        const wallet = this.model;

        const options = {
            title: this.intl.t('literal.ledger.add-funds-9fe15', { name: wallet.name }),
            acceptButtonText: this.intl.t('literal.ledger.add-funds'),
            acceptButtonIcon: 'plus-circle',
            wallet,
            amount: 0,
            description: '',
            setAmount: (centsValue) => {
                options.amount = centsValue;
            },
            setDescription: (event) => {
                options.description = event.target.value;
            },
            confirm: async (modal) => {
                if (!options.amount || options.amount <= 0) {
                    this.notifications.warning(this.intl.t('literal.ledger.please-enter-a-valid-amount-greater-than-zero'));
                    return;
                }
                modal.startLoading();
                try {
                    await this.fetch.post(`wallets/${wallet.id}/credit`, { amount: options.amount, description: options.description || 'Manual top-up' }, { namespace: 'ledger/int/v1' });
                    this.notifications.success(this.intl.t('literal.ledger.funds-added-to', { name: wallet.name }));
                    await wallet.reload();
                    modal.done();
                } catch (error) {
                    this.notifications.serverError(error);
                    modal.stopLoading();
                }
            },
        };

        this.modalsManager.show('modals/wallet-top-up', options);
    }

    @action async transferFunds() {
        const wallet = this.model;

        const options = {
            title: this.intl.t('literal.ledger.transfer-funds', { name: wallet.name }),
            acceptButtonText: this.intl.t('literal.ledger.transfer'),
            acceptButtonIcon: 'exchange-alt',
            wallet,
            toWallet: null,
            amount: 0,
            description: '',
            setToWallet: (selectedWallet) => {
                options.toWallet = selectedWallet;
            },
            setAmount: (centsValue) => {
                options.amount = centsValue;
            },
            setDescription: (event) => {
                options.description = event.target.value;
            },
            confirm: async (modal) => {
                if (!options.toWallet) {
                    this.notifications.warning(this.intl.t('literal.ledger.please-select-a-destination-wallet'));
                    return;
                }
                if (!options.amount || options.amount <= 0) {
                    this.notifications.warning(this.intl.t('literal.ledger.please-enter-a-valid-amount-greater-than-zero'));
                    return;
                }
                if (options.toWallet.id === wallet.id) {
                    this.notifications.warning(this.intl.t('literal.ledger.cannot-transfer-funds-to-the-same-wallet'));
                    return;
                }
                modal.startLoading();
                try {
                    await this.fetch.post(
                        `wallets/${wallet.id}/transfer`,
                        {
                            to_wallet_uuid: options.toWallet.id,
                            amount: options.amount,
                            description: options.description || this.intl.t('literal.ledger.internal-transfer'),
                        },
                        { namespace: 'ledger/int/v1' }
                    );
                    this.notifications.success(this.intl.t('literal.ledger.funds-transferred-to', { name: options.toWallet.name }));
                    await wallet.reload();
                    modal.done();
                } catch (error) {
                    this.notifications.serverError(error);
                    modal.stopLoading();
                }
            },
        };

        this.modalsManager.show('modals/wallet-transfer', options);
    }
}
