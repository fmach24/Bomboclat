
const socket = io();

export default class LobbyScene extends Phaser.Scene {
    constructor() {
        super('LobbyScene');
        this.playersList = null;
        this.inputNick = null;
        this.startButton = null;
        this.maps = [
            { name: 'beach', displayName: 'Beach Map', previewKey: 'beachPreview' },
            { name: 'forest', displayName: 'Forest Map', previewKey: 'forestPreview' }
        ];
        this.currentMapIndex = 0;
    }

    preload() {
        // Załaduj miniaturki map do podglądu
        this.load.image('beachPreview', 'assets/beachTiles.png');
        this.load.image('forestPreview', 'assets/forestTiles.png');
        
        // Można też załadować faktyczne mapy do generowania podglądu
        this.load.tilemapTiledJSON('beachMap', 'assets/beachMap.tmj');
        this.load.tilemapTiledJSON('forestMap', 'assets/forestMap.tmj');
        this.load.image('beachTiles', 'assets/beachTiles.png');
        this.load.image('forestTiles', 'assets/forestTiles.png');
    }

    create() {
        // Tło
        this.add.rectangle(400, 300, 800, 600, 0x222222);
        
        // Tytuł gry
        this.add.text(400, 100, 'BOMBOCLAT', {
            fontSize: '48px',
            fontFamily: 'Arial',
            color: '#ffffff',
            stroke: '#000000',
            strokeThickness: 4
        }).setOrigin(0.5);

        //pole nicku
        this.inputNick = this.add.dom(400, 180, 'input', {
            id: 'menu-nick',
            type: 'text',
            maxlength: 16,
            placeholder: 'Twój nick',
            style: 'padding: 10px; font-size: 16px; border-radius: 8px; border: 2px solid #444; background: #333; color: white;'
        }).setOrigin(0.5).setInteractive();

        // --- SEKCJA WYBORU MAPY ---
        
        // Label "Wybierz mapę"
        this.add.text(400, 240, 'Wybierz mapę:', {
            fontSize: '24px',
            fontFamily: 'Arial',
            color: '#ffffff'
        }).setOrigin(0.5);

        // Przycisk poprzednia mapa
        this.prevMapButton = this.add.text(250, 300, '◀', {
            fontSize: '40px',
            color: '#ffffff',
            backgroundColor: '#444444',
            padding: { x: 20, y: 10 }
        }).setOrigin(0.5).setInteractive({ useHandCursor: true });

        // Przycisk następna mapa  
        this.nextMapButton = this.add.text(550, 300, '▶', {
            fontSize: '40px',
            color: '#ffffff',
            backgroundColor: '#444444',
            padding: { x: 20, y: 10 }
        }).setOrigin(0.5).setInteractive({ useHandCursor: true });

        // Kontener na podgląd mapy (400x200)
        this.mapPreviewContainer = this.add.container(400, 320);
        this.mapPreviewBg = this.add.rectangle(0, 0, 220, 140, 0x555555);
        this.mapPreviewContainer.add(this.mapPreviewBg);

        // Nazwa aktualnej mapy
        this.mapNameText = this.add.text(400, 400, '', {
            fontSize: '20px',
            fontFamily: 'Arial',
            color: '#ffffff',
            stroke: '#000000',
            strokeThickness: 2
        }).setOrigin(0.5);

        // Przycisk startu
        this.startButton = this.add.text(400, 480, 'Rozpocznij grę', {
            fontSize: '24px',
            fontFamily: 'Arial',
            color: '#ffffff',
            backgroundColor: '#007700',
            padding: { x: 30, y: 15 }
        }).setOrigin(0.5).setInteractive({ useHandCursor: true });

        // Obsługa przycisków map
        this.prevMapButton.on('pointerdown', () => {
            this.changeMap(-1);
        });

        this.nextMapButton.on('pointerdown', () => {
            this.changeMap(1);
        });

        // Hover efekty dla przycisków
        this.prevMapButton.on('pointerover', () => {
            this.prevMapButton.setStyle({ backgroundColor: '#666666' });
        });
        this.prevMapButton.on('pointerout', () => {
            this.prevMapButton.setStyle({ backgroundColor: '#444444' });
        });

        this.nextMapButton.on('pointerover', () => {
            this.nextMapButton.setStyle({ backgroundColor: '#666666' });
        });
        this.nextMapButton.on('pointerout', () => {
            this.nextMapButton.setStyle({ backgroundColor: '#444444' });
        });

        this.startButton.on('pointerover', () => {
            this.startButton.setStyle({ backgroundColor: '#009900' });
        });
        this.startButton.on('pointerout', () => {
            this.startButton.setStyle({ backgroundColor: '#007700' });
        });

        // Obsługa kliknięcia start
        this.startButton.on('pointerdown', () => {
            const nick = this.inputNick.node.value.trim() || 'Gracz';
            const preferredMap = this.maps[this.currentMapIndex].name;

            // Zablokuj kontrolki
            this.inputNick.node.disabled = true;
            this.startButton.setStyle({ backgroundColor: '#555555' });
            this.startButton.removeInteractive();
            this.prevMapButton.removeInteractive();
            this.nextMapButton.removeInteractive();

            socket.emit("registerPlayer", { nick, preferredMap });
        });

        // Inicjalizuj wybór mapy
        this.updateMapDisplay();

        socket.on("startGame", (sockets, players, mapName) => {
            const playerId = sockets[socket.id].id;
            this.scene.start('GameScene', { players: players, playerId: playerId, socket: socket, mapName: mapName });
        });
    }

    changeMap(direction) {
        this.currentMapIndex += direction;
        
        // Zapętl indeks
        if (this.currentMapIndex < 0) {
            this.currentMapIndex = this.maps.length - 1;
        } else if (this.currentMapIndex >= this.maps.length) {
            this.currentMapIndex = 0;
        }
        
        this.updateMapDisplay();
    }

    updateMapDisplay() {
        const currentMap = this.maps[this.currentMapIndex];
        
        // Aktualizuj nazwę mapy
        this.mapNameText.setText(currentMap.displayName);
        
        // Usuń poprzedni podgląd
        if (this.mapPreviewImage) {
            this.mapPreviewImage.destroy();
        }
        
        // Dodaj nowy podgląd mapy
        this.mapPreviewImage = this.add.image(0, 0, currentMap.previewKey);
        this.mapPreviewImage.setDisplaySize(200, 120); // Skaluj do rozmiaru kontenera
        this.mapPreviewContainer.add(this.mapPreviewImage);
    }
}