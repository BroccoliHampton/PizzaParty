// js/ui.js
import * as State from './state.js';

// --- Private Helper Functions (only used inside this file) ---

const formatNumber = (num) => {
    const n = parseFloat(num);
    if (n >= 1000000) return (n / 1000000).toFixed(2) + 'M';
    if (n >= 1000) return (n / 1000).toFixed(2) + 'K';
    return n.toFixed(2);
};

const formatTime = (seconds) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
};

// --- Exported Functions ---

/**
 * Finds all DOM elements and returns them in an organized object.
 */
export function cacheDOMElements() {
    return {
        pizzeria: { // Renamed from 'glazery'
            kingStatus: document.getElementById('pizzeria-chef-status'),
            pps: document.getElementById('pizzeria-pps'), // Renamed from 'cps'
            baked: document.getElementById('pizzeria-baked-time'), // Renamed from 'baked'
            actionButton: document.getElementById('pizzeria-action-button'),
            canvas: document.getElementById('pizza-canvas'),
            rainContainer: document.getElementById('pizza-slice-container'), // Renamed from 'cookie-rain-container'
            sauceColorButton: document.getElementById('sauce-color-button'), // Renamed
            toppingColorButton: document.getElementById('topping-color-button'), // Renamed
            crustColorButton: document.getElementById('crust-color-button'), // Renamed
            zoomSlider: document.getElementById('pizzeria-zoom-slider'),
            donutBalance: document.getElementById('player-pizza-balance'), // Renamed ID
            glazePrice: document.getElementById('bake-price-display'), // Renamed ID
            availableBalance: document.getElementById('available-balance-display'),
            totalSupply: document.getElementById('total-supply-display'),
            currentDps: document.getElementById('current-pps-display'), // Renamed ID
            
            toggleButton: document.getElementById('view-toggle-button'),
            glazeContainer: document.getElementById('bake-container'), // Renamed ID
            blazeContainer: document.getElementById('party-container'), // Renamed ID
            glazeDpsDisplay: document.getElementById('bake-pps-display'), // Renamed ID

            blazePrice: document.getElementById('party-price-display'), // Renamed ID
            blazeAvailableBalance: document.getElementById('party-available-balance-display'), // Renamed ID
            blazeActionButton: document.getElementById('party-action-button'), // Renamed ID
            blazeClaimAmount: document.getElementById('party-claim-amount'), // Renamed ID
        },
        profileName: document.getElementById('player-profile-name'),
        connectWalletButton: document.getElementById('connect-wallet-button'),
        musicToggleButton: document.getElementById('music-toggle-button'),
        sfxToggleButton: document.getElementById('sfx-toggle-button'),
        darkModeToggleButton: document.getElementById('dark-mode-toggle-button'),
        infoButton: document.getElementById('info-button'),
        infoModal: document.getElementById('info-modal'),
        infoModalOverlay: document.getElementById('info-modal-overlay'),
        infoModalClose: document.getElementById('info-modal-close'),
        modalInfo: {
            totalSupply: document.getElementById('modal-total-supply'),
            nextHalving: document.getElementById('modal-next-halving'),
            currentMiner: document.getElementById('modal-current-miner'),
        }
    };
}

/**
 * Updates all UI elements related to the "Party" (LP) view.
 * Reads data from the imported State module.
 * @param {object} dom - The DOM elements object from cacheDOMElements().
 */
export function updatePartyzoneUI(dom) { // Renamed from 'updateBlazeryUI'
    if (!State.blockchainData.party) { // Renamed from 'blaze'
        console.log('[Party] No party data available');
        return;
    }
    
    console.log('[Party] Updating UI');
    
    const userNeedsApproval = State.blockchainData.party.userNeedsApproval;
    const partyButton = dom.pizzeria.blazeActionButton; // ID is blazeActionButton
    
    if (dom.pizzeria.blazePrice) { // ID is blazePrice
        const lpAmount = parseFloat(State.blockchainData.party.priceFormatted);
        dom.pizzeria.blazePrice.textContent = lpAmount.toFixed(4);
    }
    
    if (dom.pizzeria.blazeClaimAmount) { // ID is blazeClaimAmount
        const ethAmount = parseFloat(State.blockchainData.party.wethAccumulatedFormatted);
        dom.pizzeria.blazeClaimAmount.textContent = `${ethAmount.toFixed(6)} ETH`; 
    }
    
    if (dom.pizzeria.blazeAvailableBalance) { // ID is blazeAvailableBalance
        const userLpBalance = parseFloat(State.blockchainData.party.userLpBalanceFormatted);
        dom.pizzeria.blazeAvailableBalance.textContent = `${userLpBalance.toFixed(4)} LP available`;
    }
    
    if (partyButton) {
        if (userNeedsApproval) {
            partyButton.textContent = 'Approve LP';
            partyButton.disabled = false;
        } else {
            const lpBalance = parseFloat(State.blockchainData.party.userLpBalanceFormatted);
            const lpNeeded = parseFloat(State.blockchainData.party.priceFormatted);
            
            partyButton.textContent = 'Party'; // Renamed
            partyButton.disabled = lpBalance < lpNeeded;
        }
    }
    
    console.log('[Party] UI updated successfully');
}

/**
 * Updates all primary UI elements.
 * Reads data from the imported State module.
 * @param {object} dom - The DOM elements object from cacheDOMElements().
 */
export function updateUI(dom) {
    console.log('[Blockchain] Updating UI');
    
    const userIsMiner = State.blockchainData.userAddress && 
                       State.blockchainData.currentMiner && 
                       State.blockchainData.userAddress.toLowerCase() === State.blockchainData.currentMiner.toLowerCase();
    
   let headChefDisplay; // Renamed

    // Always try to show Farcaster username first
    if (State.blockchainData.currentMinerUsername) {
        headChefDisplay = `@${State.blockchainData.currentMinerUsername}`;
        // Add "(You)" if it's the current user
        if (userIsMiner) {
            headChefDisplay += ' (You)';
        }
    } else if (userIsMiner) {
        headChefDisplay = 'You';
    } else if (State.blockchainData.currentMiner && State.blockchainData.currentMiner !== '0x0000000000000000000000000000000000000000') {
        const address = State.blockchainData.currentMiner;
        headChefDisplay = `${address.slice(0, 6)}...${address.slice(-4)}`;
    } else {
        headChefDisplay = 'None';
    }
    dom.pizzeria.kingStatus.textContent = headChefDisplay;

    dom.pizzeria.pps.textContent = State.blockchainData.claimablePizzasFormatted ? formatNumber(State.blockchainData.claimablePizzasFormatted) : '0.00'; // Renamed
    dom.pizzeria.baked.textContent = formatTime(State.blockchainData.timeAsMiner || 0);
    
    dom.pizzeria.glazePrice.textContent = `${parseFloat(State.blockchainData.priceInEth || 0).toFixed(6)} ETH`;
    
    dom.pizzeria.availableBalance.textContent = `${parseFloat(State.blockchainData.userEthBalanceFormatted || 0).toFixed(4)} ETH available`;
    
    if (dom.pizzeria.blazeAvailableBalance) { // ID
         dom.pizzeria.blazeAvailableBalance.textContent = `${parseFloat(State.blockchainData.party.userLpBalanceFormatted || 0).toFixed(4)} LP available`; // Renamed
    }
    
    if (dom.pizzeria.blazeClaimAmount && State.blockchainData.party.wethAccumulatedFormatted) { // ID
        const claimEth = parseFloat(State.blockchainData.party.wethAccumulatedFormatted); // Renamed
        dom.pizzeria.blazeClaimAmount.textContent = `${claimEth.toFixed(6)} ETH`;
    }
    
    if (dom.pizzeria.glazeDpsDisplay) { // ID
         dom.pizzeria.glazeDpsDisplay.textContent = parseFloat(State.blockchainData.currentDpsFormatted || 0).toFixed(2);
    }

    dom.pizzeria.donutBalance.textContent = `🍕 ${formatNumber(State.blockchainData.userPizzaBalanceFormatted || 0)}`; // Renamed
    dom.pizzeria.totalSupply.textContent = `🍕 ${formatNumber(State.blockchainData.totalPizzaSupplyFormatted || 0)}`; // Renamed
    
    // Calculate percentage mined (user balance / total supply * 100)
    const userBalance = parseFloat(State.blockchainData.userPizzaBalanceFormatted || 0); // Renamed
    const totalSupply = parseFloat(State.blockchainData.totalPizzaSupplyFormatted || 0); // Renamed
    const percentageMined = totalSupply > 0 ? (userBalance / totalSupply * 100) : 0;
    dom.pizzeria.currentDps.textContent = `${percentageMined.toFixed(4)}%`;
    
    dom.pizzeria.actionButton.textContent = 'Bake'; // Renamed
    
    if (dom.modalInfo.totalSupply) {
        dom.modalInfo.totalSupply.textContent = `🍕 ${formatNumber(State.blockchainData.totalPizzaSupplyFormatted || 0)}`; // Renamed
        dom.modalInfo.nextHalving.textContent = formatTime(State.blockchainData.secondsUntilHalving || 0);
        
        const minerDisplay = State.blockchainData.currentMiner 
            ? `${State.blockchainData.currentMiner.slice(0, 6)}...${State.blockchainData.currentMiner.slice(-4)}`
            : 'None';
        dom.modalInfo.currentMiner.textContent = minerDisplay;
    }
}

/**
 * Toggles between the Bake and Party views.
 * @param {object} dom - The DOM elements object.
 * @param {function} playSoundEffect - The function to call for audio.
 * @param {object} composer - The Three.js EffectComposer.
 */
export function toggleView(dom, playSoundEffect, composer) {
    playSoundEffect('crunch');
    State.uiState.isBakeView = !State.uiState.isBakeView; // Renamed
    
    if (State.uiState.isBakeView) { // Renamed
        dom.pizzeria.glazeContainer.classList.remove('hidden'); // ID
        dom.pizzeria.blazeContainer.classList.add('hidden'); // ID
        dom.pizzeria.toggleButton.textContent = '🧊';
        dom.pizzeria.rainContainer.classList.remove('party-active'); // Renamed
        if (composer) {
            composer.enabled = false;
        }
    } else {
        dom.pizzeria.glazeContainer.classList.add('hidden'); // ID
        dom.pizzeria.blazeContainer.classList.remove('hidden'); // ID
        dom.pizzeria.toggleButton.textContent = '🔥';
        dom.pizzeria.rainContainer.classList.add('party-active'); // Renamed
        if (composer) {
            composer.enabled = true;
        }
    }
}

/**
 * Toggles dark mode on and off.
 * @param {object} dom - The DOM elements object.
 * @param {function} playSoundEffect - The function to call for audio.
 */
export function toggleDarkMode(dom, playSoundEffect) {
    playSoundEffect('crunch');
    State.uiState.isDarkMode = !State.uiState.isDarkMode;
    const body = document.body;
    if (State.uiState.isDarkMode) {
        body.classList.add('dark');
        dom.darkModeToggleButton.textContent = '☀️';
    } else {
        body.classList.remove('dark');
        dom.darkModeToggleButton.textContent = '🌙';
    }
}

/**
 * Shows the info modal.
 * @param {object} dom - The DOM elements object.
 * @param {function} playSoundEffect - The function to call for audio.
 */
export function showInfoModal(dom, playSoundEffect) {
    playSoundEffect('crunch');
    dom.infoModal.classList.remove('hidden');
    dom.infoModalOverlay.classList.remove('hidden');
}

/**
 * Hides the info modal.
 * @param {object} dom - The DOM elements object.
 */
export function hideInfoModal(dom) {
    dom.infoModal.classList.add('hidden');
    dom.infoModalOverlay.classList.add('hidden');
}
