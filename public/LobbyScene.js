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
        this.inputNick = this.add.dom(400, 240, 'input', {
            id: 'menu-nick',
            type: 'text',
            maxlength: 16,
            placeholder: 'Twój nick'
        }).setOrigin(0.5).setInteractive();

        // Przycisk startu (z klasą do stylowania)
        this.startButton = this.add.dom(400, 320, 'button', {
            class: 'menu-btn'
        }, 'Rozpocznij grę').setOrigin(0.5).setInteractive();

        // Obsługa kliknięcia
        this.startButton.addListener('click');
        this.startButton.on('click', () => {
            const nick = this.inputNick.node.value.trim() || 'Gracz';
            
            // Zablokuj input i przycisk
            this.inputNick.node.disabled = true;
            this.startButton.node.disabled = true;
            this.startButton.node.style.opacity = '0.5';
            
            socket.emit("registerPlayer", { nick });
        });

        socket.on("startGame", (sockets, players, mapName) => {

            const playerId = sockets[socket.id].id;
            
            this.scene.start('GameScene', { players: players, playerId: playerId, socket: socket, mapName: mapName });
        });

    }
}