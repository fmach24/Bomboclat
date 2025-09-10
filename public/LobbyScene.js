
const socket = io();

export default class LobbyScene extends Phaser.Scene {
    constructor() {
        super('LobbyScene');
        this.playersList = null;
        this.inputNick = null;
        this.startButton = null;
        this.maps = [
            { name: 'beach', displayName: 'Beach Map', previewKey: 'beachPreview' },
            { name: 'forest', displayName: 'Forest Map', previewKey: 'forestPreview' },
            { name: 'portugal', displayName: 'Portugal Map', previewKey: 'portugalPreview' }
        ];
        this.currentMapIndex = 0;
        
        this.playerSkins = [
            { name: 'bombardinho', displayName: 'Bombardinho', previewKey: 'bombardinhoPreview' },
            { name: 'filipek', displayName: 'Filipek', previewKey: 'filipekPreview' },
            { name: 'guczo', displayName: 'Guczo', previewKey: 'guczoPreview' }
        ];
        this.currentSkinIndex = 0;
    }

    preload() {
        // Załaduj miniaturki map do podglądu
        this.load.image('beachPreview', 'assets/beachTiles.png');
        this.load.image('forestPreview', 'assets/forestTiles.png');
        this.load.image('portugalPreview', 'assets/portugalTiles.png');

        // Załaduj podglądy skinów gracza
        this.load.image('bombardinhoPreview', 'assets/animations/bombardinho_down1.png');
        this.load.image('filipekPreview', 'assets/animations/filipek_down1.png');
        this.load.image('guczoPreview', 'assets/animations/Guczo1.png');
        
        // Można też załadować faktyczne mapy do generowania podglądu
        this.load.tilemapTiledJSON('beachMap', 'assets/beachMap.tmj');
        this.load.tilemapTiledJSON('forestMap', 'assets/forestMap.tmj');
        this.load.image('beachTiles', 'assets/beachTiles.png');
        this.load.image('forestTiles', 'assets/forestTiles.png');
        this.load.tilemapTiledJSON('portugalMap', 'assets/portugalMap.tmj');
        this.load.image('portugalTiles', 'assets/portugalTiles.png');   
    }

    create() {
        // Czarne tło
        this.add.rectangle(400, 300, 800, 600, 0x0b0b0b);

        // Pole nicku - na górze
        // Pole nicku - na górze - jeszcze większe
        this.inputNick = this.add.dom(400, 80, 'input', {
            id: 'menu-nick',
            type: 'text',
            maxlength: 16,
            placeholder: 'Twój nick',
            style: `
                border: 2px solid #444;
                padding: 20px 25px; 
                font-size: 24px; 
                border-radius: 15px; 
                background: #0b0b0b; 
                color: #444444; 
                width: 450px; 
                text-align: center;
            `
        }).setOrigin(0.5).setInteractive();

        // Wybór mapy i skina - w jednym rzędzie - większe okienka
        const selectionY = 180;
        
        // Sekcja wyboru mapy (lewa strona) - kolor jak powerups
        this.add.rectangle(250, selectionY, 220, 120, 0x444444);

        // Zaokrąglona obramówka dla mapy - cienka szara jak powerups
        const mapBorder = this.add.graphics();
        mapBorder.lineStyle(1, 0x888888, 1);
        mapBorder.strokeRoundedRect(250 - 110, selectionY - 60, 220, 120, 8);

        // Przyciski nawigacji map
        this.prevMapButton = this.add.text(150, selectionY, '◀', {
            fontSize: '24px',
            color: '#ffffff'
        }).setOrigin(0.5).setInteractive({ useHandCursor: true });

        this.nextMapButton = this.add.text(350, selectionY, '▶', {
            fontSize: '24px',
            color: '#ffffff'
        }).setOrigin(0.5).setInteractive({ useHandCursor: true });

        // Nazwa mapy
        this.mapNameText = this.add.text(250, selectionY + 70, '', {
            fontSize: '16px',
            color: '#ffffff'
        }).setOrigin(0.5);

        // Sekcja wyboru skina (prawa strona) - kolor jak powerups
        this.add.rectangle(550, selectionY, 220, 120, 0x444444);
        
        // Zaokrąglona obramówka dla skina - cienka szara jak powerups
        const skinBorder = this.add.graphics();
        skinBorder.lineStyle(1, 0x888888, 1);
        skinBorder.strokeRoundedRect(550 - 110, selectionY - 60, 220, 120, 8);

        // Przyciski nawigacji skinów
        this.prevSkinButton = this.add.text(450, selectionY, '◀', {
            fontSize: '24px',
            color: '#ffffff'
        }).setOrigin(0.5).setInteractive({ useHandCursor: true });

        this.nextSkinButton = this.add.text(650, selectionY, '▶', {
            fontSize: '24px',
            color: '#ffffff'
        }).setOrigin(0.5).setInteractive({ useHandCursor: true });

        // Nazwa skina
        this.skinNameText = this.add.text(550, selectionY + 70, '', {
            fontSize: '16px',
            color: '#ffffff'
        }).setOrigin(0.5);

        // Przycisk dołącz - pod sekcjami wyboru
        this.startButton = this.add.text(400, 320, 'Dołącz do gry', {
            fontSize: '24px',
            fontFamily: 'Arial Black',
            color: '#000000',
            border: '2px solid #444',
            borderRadius: '15px',
            backgroundColor: '#ffffff',
            padding: { x: 30, y: 12 }
        }).setOrigin(0.5).setInteractive({ useHandCursor: true });

        // Obsługa przycisków map
        this.prevMapButton.on('pointerdown', () => {
            this.changeMap(-1);
        });

        this.nextMapButton.on('pointerdown', () => {
            this.changeMap(1);
        });

        // Obsługa przycisków skinów
        this.prevSkinButton.on('pointerdown', () => {
            this.changeSkin(-1);
        });

        this.nextSkinButton.on('pointerdown', () => {
            this.changeSkin(1);
        });

        // Hover efekty dla przycisków
        this.prevMapButton.on('pointerover', () => {
            this.prevMapButton.setStyle({ color: '#cccccc' });
        });
        this.prevMapButton.on('pointerout', () => {
            this.prevMapButton.setStyle({ color: '#ffffff' });
        });

        this.nextMapButton.on('pointerover', () => {
            this.nextMapButton.setStyle({ color: '#cccccc' });
        });
        this.nextMapButton.on('pointerout', () => {
            this.nextMapButton.setStyle({ color: '#ffffff' });
        });

        this.prevSkinButton.on('pointerover', () => {
            this.prevSkinButton.setStyle({ color: '#cccccc' });
        });
        this.prevSkinButton.on('pointerout', () => {
            this.prevSkinButton.setStyle({ color: '#ffffff' });
        });

        this.nextSkinButton.on('pointerover', () => {
            this.nextSkinButton.setStyle({ color: '#cccccc' });
        });
        this.nextSkinButton.on('pointerout', () => {
            this.nextSkinButton.setStyle({ color: '#ffffff' });
        });

        this.startButton.on('pointerover', () => {
            this.startButton.setStyle({ backgroundColor: '#cccccc' });
        });
        this.startButton.on('pointerout', () => {
            this.startButton.setStyle({ backgroundColor: '#ffffff' });
        });

        // Obsługa kliknięcia start
        this.startButton.on('pointerdown', () => {
            const nick = this.inputNick.node.value.trim() || 'Gracz';
            const preferredMap = this.maps[this.currentMapIndex].name;
            const playerSkin = this.playerSkins[this.currentSkinIndex].name;

            // Zablokuj kontrolki
            this.inputNick.node.disabled = true;
            this.startButton.setText('Oczekiwanie...');
            this.startButton.setStyle({ backgroundColor: '#666666' });
            this.startButton.removeInteractive();
            this.prevMapButton.removeInteractive();
            this.nextMapButton.removeInteractive();
            this.prevSkinButton.removeInteractive();
            this.nextSkinButton.removeInteractive();

            socket.emit("registerPlayer", { nick, preferredMap, playerSkin });
        });

        // Inicjalizuj wybór mapy i skina
        this.updateMapDisplay();
        this.updateSkinDisplay();

        socket.on("startGame", (sockets, players, mapName) => {
            const playerId = sockets[socket.id].id;
            const gameData = { players: players, playerId: playerId, socket: socket, mapName: mapName };
            this.startCountdown(gameData);
        });
    }

    startCountdown(gameData) {
        // Ukryj wszystkie elementy lobby
        this.children.each((child) => {
            if (child !== this.cameras.main) {
                child.setVisible(false);
            }
        });

        // Ciemne tło odliczania
        this.countdownBg = this.add.rectangle(400, 300, 800, 600, 0x000000, 0.9);
        
        // Tekst "Gra się rozpoczyna!"
        this.gameStartText = this.add.text(400, 200, 'Gra się rozpoczyna!', {
            fontSize: '36px',
            fontFamily: 'Arial Black',
            color: '#ffffff',
            stroke: '#000000',
            strokeThickness: 4,
            shadow: { offsetX: 3, offsetY: 3, color: '#000000', blur: 6, fill: true }
        }).setOrigin(0.5);

        // Tekst odliczania - duży i wyraźny
        this.countdownText = this.add.text(400, 300, '3', {
            fontSize: '140px',
            fontFamily: 'Arial Black',
            color: '#ffffff',
            stroke: '#ff4444',
            strokeThickness: 10,
            shadow: { offsetX: 5, offsetY: 5, color: '#000000', blur: 12, fill: true }
        }).setOrigin(0.5);

        // Tekst pomocy
        this.helpText = this.add.text(400, 400, 'Przygotuj się do walki!', {
            fontSize: '24px',
            fontFamily: 'Arial',
            color: '#cccccc',
            stroke: '#000000',
            strokeThickness: 2
        }).setOrigin(0.5);

        let countdown = 3;
        
        // Timer odliczania
        this.countdownTimer = this.time.addEvent({
            delay: 1000,
            callback: () => {
                countdown--;
                
                if (countdown > 0) {
                    this.countdownText.setText(countdown.toString());
                    
                    // Efekt pulsowania - każda cyfra
                    this.countdownText.setScale(1.8);
                    this.tweens.add({
                        targets: this.countdownText,
                        scaleX: 1,
                        scaleY: 1,
                        duration: 400,
                        ease: 'Bounce.out'
                    });
                    
                    // Zmiana koloru stopniowo
                    if (countdown === 2) {
                        this.countdownText.setStyle({ stroke: '#ff8844' });
                    } else if (countdown === 1) {
                        this.countdownText.setStyle({ stroke: '#ffaa44' });
                    }
                    
                } else {
                    // Pokaż "START!"
                    this.countdownText.setText('START!');
                    this.countdownText.setStyle({ 
                        color: '#44ff44', 
                        stroke: '#006600',
                        fontSize: '120px'
                    });
                    this.gameStartText.setText('Walka rozpoczęta!');
                    this.helpText.setText('Powodzenia!');
                    
                    // Animacja eksplozji START
                    this.countdownText.setScale(2.5);
                    this.tweens.add({
                        targets: this.countdownText,
                        scaleX: 1,
                        scaleY: 1,
                        duration: 600,
                        ease: 'Back.out'
                    });
                    
                    // Płynne przejście do gry po 0.5 sekundzie
                    this.time.delayedCall(500, () => {
                        // Animacja zanikania
                        this.tweens.add({
                            targets: [this.countdownBg, this.countdownText, this.gameStartText, this.helpText],
                            alpha: 0,
                            duration: 500,
                            ease: 'Power2',
                            onComplete: () => {
                                this.scene.start('GameScene', gameData);
                            }
                        });
                    });
                }
            },
            repeat: 2
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
        
        // Dodaj nowy podgląd mapy w zmniejszonym rozmiarze żeby pasował
        this.mapPreviewImage = this.add.image(250, 180, currentMap.previewKey);
        this.mapPreviewImage.setDisplaySize(150, 75);
    }

    changeSkin(direction) {
        this.currentSkinIndex += direction;
        
        // Zapętl indeks
        if (this.currentSkinIndex < 0) {
            this.currentSkinIndex = this.playerSkins.length - 1;
        } else if (this.currentSkinIndex >= this.playerSkins.length) {
            this.currentSkinIndex = 0;
        }
        
        this.updateSkinDisplay();
    }

    updateSkinDisplay() {
        const currentSkin = this.playerSkins[this.currentSkinIndex];
        
        // Aktualizuj nazwę skina
        this.skinNameText.setText(currentSkin.displayName);
        
        // Usuń poprzedni podgląd
        if (this.skinPreviewImage) {
            this.skinPreviewImage.destroy();
        }
        
        // Dodaj nowy podgląd skina w większym prostokącie
        this.skinPreviewImage = this.add.image(550, 180, currentSkin.previewKey);
        this.skinPreviewImage.setDisplaySize(70, 70);
    }
}