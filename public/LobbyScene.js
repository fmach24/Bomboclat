
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
        
        this.playerSkins = [
            { name: 'bombardinho', displayName: 'Bombardinho', previewKey: 'bombardinhoPreview' },
            { name: 'szczups', displayName: 'Szczups', previewKey: 'szczupsPreview' }
        ];
        this.currentSkinIndex = 0;
    }

    preload() {
        // Załaduj miniaturki map do podglądu
        this.load.image('beachPreview', 'assets/beachTiles.png');
        this.load.image('forestPreview', 'assets/forestTiles.png');
        
        // Załaduj podglądy skinów gracza
        this.load.image('bombardinhoPreview', 'assets/animations/bombardinho_down1.png');
        this.load.image('szczupsPreview', 'assets/animations/szczups1.png');
        
        // Można też załadować faktyczne mapy do generowania podglądu
        this.load.tilemapTiledJSON('beachMap', 'assets/beachMap.tmj');
        this.load.tilemapTiledJSON('forestMap', 'assets/forestMap.tmj');
        this.load.image('beachTiles', 'assets/beachTiles.png');
        this.load.image('forestTiles', 'assets/forestTiles.png');
    }

    create() {
        // Gradient tło - dostosowane do nowego rozmiaru 800x600
        this.add.rectangle(400, 300, 800, 600, 0x1a1a2e);
        
        // Dodatkowe elementy dekoracyjne
        this.add.rectangle(400, 300, 780, 580, 0x16213e, 0.3);
        this.add.rectangle(400, 300, 780, 580).setStrokeStyle(2, 0x0f3460, 0.5);
        
        // Tytuł gry - przesunięty wyżej
        this.add.text(400, 50, 'BOMBOCLAT', {
            fontSize: '42px',
            fontFamily: 'Arial Black',
            color: '#ffffff',
            stroke: '#e94560',
            strokeThickness: 5,
            shadow: { offsetX: 3, offsetY: 3, color: '#000000', blur: 6, fill: true }
        }).setOrigin(0.5);

        // Pole nicku - mniejsze i wyżej
        this.inputNick = this.add.dom(400, 100, 'input', {
            id: 'menu-nick',
            type: 'text',
            maxlength: 16,
            placeholder: 'Twój nick',
            style: `
                padding: 8px 15px; 
                font-size: 14px; 
                border-radius: 8px; 
                border: 2px solid #0f3460; 
                background: linear-gradient(145deg, #16213e, #1a1a2e); 
                color: white; 
                width: 200px; 
                text-align: center;
                box-shadow: inset 0 2px 4px rgba(0,0,0,0.3);
                transition: all 0.3s ease;
            `
        }).setOrigin(0.5).setInteractive();

        // --- CAŁKOWICIE NOWY, WYCENTROWANY UKŁAD ---
        
        const centerX = 400; // Środek ekranu 800px
        const centerY = 300; // Środek ekranu 600px
        
        // === TYTUŁ I NICK NA GÓRZE ===
        // Nick już jest ustawiony wyżej
        
        // === POJEDYNCZY RZĄD SEKCJI ===
        const sectionY = 220; // Niżej niż nick, ale wyżej niż środek
        const mapX = 250;     // Lewa strona
        const skinX = 550;    // Prawa strona
        
        // === SEKCJA MAP (LEWA) ===
        
        // Ramka dla sekcji map
        this.add.rectangle(mapX, sectionY, 140, 120, 0x16213e, 0.8);
        this.add.rectangle(mapX, sectionY, 140, 120).setStrokeStyle(2, 0x0f3460);
        
        // Label "Wybierz mapę"
        this.add.text(mapX, sectionY - 60, 'Wybierz mapę:', {
            fontSize: '16px',
            fontFamily: 'Arial',
            color: '#ffffff',
            stroke: '#000000',
            strokeThickness: 1
        }).setOrigin(0.5);

        // Kontener sekcji map
        this.mapSectionContainer = this.add.container(mapX, sectionY);
        
        // Tło podglądu mapy
        this.mapPreviewBg = this.add.rectangle(0, 0, 100, 60, 0x0f3460);
        this.mapPreviewBg.setStrokeStyle(2, 0x533483);

        // Przyciski nawigacji map
        this.prevMapButton = this.add.text(-60, 0, '◀', {
            fontSize: '18px',
            color: '#ffffff',
            backgroundColor: '#0f3460',
            padding: { x: 6, y: 3 }
        }).setOrigin(0.5).setInteractive({ useHandCursor: true });

        this.nextMapButton = this.add.text(60, 0, '▶', {
            fontSize: '18px',
            color: '#ffffff',
            backgroundColor: '#0f3460',
            padding: { x: 6, y: 3 }
        }).setOrigin(0.5).setInteractive({ useHandCursor: true });

        // Nazwa mapy
        this.mapNameText = this.add.text(0, 35, '', {
            fontSize: '11px',
            fontFamily: 'Arial',
            color: '#ffffff',
            stroke: '#000000',
            strokeThickness: 1
        }).setOrigin(0.5);

        // Dodaj elementy do kontenera map
        this.mapSectionContainer.add([this.mapPreviewBg, this.prevMapButton, this.nextMapButton, this.mapNameText]);

        // === SEKCJA SKINÓW (PRAWA) ===
        
        // Ramka dla sekcji skinów
        this.add.rectangle(skinX, sectionY, 100, 120, 0x16213e, 0.8);
        this.add.rectangle(skinX, sectionY, 100, 120).setStrokeStyle(2, 0x0f3460);
        
        // Label "Wybierz skin"
        this.add.text(skinX, sectionY - 60, 'Wybierz skin:', {
            fontSize: '16px',
            fontFamily: 'Arial',
            color: '#ffffff',
            stroke: '#000000',
            strokeThickness: 1
        }).setOrigin(0.5);

        // Kontener sekcji skinów
        this.skinSectionContainer = this.add.container(skinX, sectionY);
        
        // Tło podglądu skina
        this.skinPreviewBg = this.add.rectangle(0, 0, 50, 50, 0x0f3460);
        this.skinPreviewBg.setStrokeStyle(2, 0x533483);

        // Przyciski nawigacji skinów
        this.prevSkinButton = this.add.text(-35, 0, '◀', {
            fontSize: '18px',
            color: '#ffffff',
            backgroundColor: '#0f3460',
            padding: { x: 6, y: 3 }
        }).setOrigin(0.5).setInteractive({ useHandCursor: true });

        this.nextSkinButton = this.add.text(35, 0, '▶', {
            fontSize: '18px',
            color: '#ffffff',
            backgroundColor: '#0f3460',
            padding: { x: 6, y: 3 }
        }).setOrigin(0.5).setInteractive({ useHandCursor: true });

        // Nazwa skina
        this.skinNameText = this.add.text(0, 35, '', {
            fontSize: '11px',
            fontFamily: 'Arial',
            color: '#ffffff',
            stroke: '#000000',
            strokeThickness: 1
        }).setOrigin(0.5);

        // Dodaj elementy do kontenera skinów
        this.skinSectionContainer.add([this.skinPreviewBg, this.prevSkinButton, this.nextSkinButton, this.skinNameText]);

        // Przycisk startu - idealnie wycentrowany na dole
        this.startButton = this.add.text(centerX, 340, 'Rozpocznij grę', {
            fontSize: '22px',
            fontFamily: 'Arial Black',
            color: '#ffffff',
            backgroundColor: '#27ae60',
            padding: { x: 25, y: 10 },
            shadow: { offsetX: 2, offsetY: 2, color: '#000000', blur: 4, fill: true }
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

        // Hover efekty dla przycisków map
        this.prevMapButton.on('pointerover', () => {
            this.prevMapButton.setStyle({ backgroundColor: '#533483' });
        });
        this.prevMapButton.on('pointerout', () => {
            this.prevMapButton.setStyle({ backgroundColor: '#0f3460' });
        });

        this.nextMapButton.on('pointerover', () => {
            this.nextMapButton.setStyle({ backgroundColor: '#533483' });
        });
        this.nextMapButton.on('pointerout', () => {
            this.nextMapButton.setStyle({ backgroundColor: '#0f3460' });
        });

        // Hover efekty dla przycisków skinów
        this.prevSkinButton.on('pointerover', () => {
            this.prevSkinButton.setStyle({ backgroundColor: '#533483' });
        });
        this.prevSkinButton.on('pointerout', () => {
            this.prevSkinButton.setStyle({ backgroundColor: '#0f3460' });
        });

        this.nextSkinButton.on('pointerover', () => {
            this.nextSkinButton.setStyle({ backgroundColor: '#533483' });
        });
        this.nextSkinButton.on('pointerout', () => {
            this.nextSkinButton.setStyle({ backgroundColor: '#0f3460' });
        });

        this.startButton.on('pointerover', () => {
            this.startButton.setStyle({ backgroundColor: '#2ecc71' });
        });
        this.startButton.on('pointerout', () => {
            this.startButton.setStyle({ backgroundColor: '#27ae60' });
        });

        // Obsługa kliknięcia start
        this.startButton.on('pointerdown', () => {
            const nick = this.inputNick.node.value.trim() || 'Gracz';
            const preferredMap = this.maps[this.currentMapIndex].name;
            const playerSkin = this.playerSkins[this.currentSkinIndex].name;

            // Zablokuj kontrolki
            this.inputNick.node.disabled = true;
            this.startButton.setText('Oczekiwanie...');
            this.startButton.setStyle({ backgroundColor: '#95a5a6' });
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
        
        // Dodaj nowy podgląd mapy - bardzo kompaktowy
        this.mapPreviewImage = this.add.image(0, 0, currentMap.previewKey);
        this.mapPreviewImage.setDisplaySize(80, 50);
        this.mapSectionContainer.add(this.mapPreviewImage);
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
        
        // Dodaj nowy podgląd skina - bardzo kompaktowy
        this.skinPreviewImage = this.add.image(0, 0, currentSkin.previewKey);
        this.skinPreviewImage.setDisplaySize(35, 35);
        this.skinSectionContainer.add(this.skinPreviewImage);
    }
}