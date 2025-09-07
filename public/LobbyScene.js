
const socket = io();

export default class LobbyScene extends Phaser.Scene {
    constructor() {
        super('LobbyScene');
        this.playersList = null;
        this.inputNick = null;
        this.startButton = null;
    }

    create() {

        //pole nicku
        this.inputNick = this.add.dom(400, 200, 'input', {
            id: 'menu-nick',
            type: 'text',
            maxlength: 16,
            placeholder: 'Twój nick'
        }).setOrigin(0.5).setInteractive();

        // Dropdown wyboru mapy
        this.mapSelector = this.add.dom(400, 260, 'select', {
            id: 'map-selector',
            style: 'padding: 8px; font-size: 16px; border-radius: 4px;'
        }).setOrigin(0.5).setInteractive();

        // Dodaj opcje map
        this.mapSelector.node.innerHTML = `
            <option value="beach">Beach Map</option>
            <option value="forest">Forest Map</option>
            <option value="city">City Map</option>
        `;

        // Przycisk startu (z klasą do stylowania)
        this.startButton = this.add.dom(400, 320, 'button', {
            class: 'menu-btn'
        }, 'Rozpocznij grę').setOrigin(0.5).setInteractive();

        // Obsługa kliknięcia
        this.startButton.addListener('click');
        this.startButton.on('click', () => {
            const nick = this.inputNick.node.value.trim() || 'Gracz';
            const preferredMap = this.mapSelector.node.value;
            
            // Zablokuj input i przycisk
            this.inputNick.node.disabled = true;
            this.mapSelector.node.disabled = true;
            this.startButton.node.disabled = true;
            this.startButton.node.style.opacity = '0.5';
            
            socket.emit("registerPlayer", { nick, preferredMap });
        });

        socket.on("startGame", (sockets, players, mapName) => {

            const playerId = sockets[socket.id].id;
            
            this.scene.start('GameScene', { players: players, playerId: playerId, socket: socket, mapName: mapName });
        });

    }
}