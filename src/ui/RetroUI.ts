import Phaser from 'phaser';

export class RetroUI {
  /**
   * レトロ風パネルを作成（半透明黒オーバーレイ + 中央パネル（太枠・直角））
   */
  static createPanel(
    scene: Phaser.Scene,
    x: number,
    y: number,
    width: number,
    height: number,
    overlayAlpha: number = 0.6
  ): { overlay: Phaser.GameObjects.Rectangle; panel: Phaser.GameObjects.Container } {
    // 半透明黒のオーバーレイ
    const overlay = scene.add.rectangle(320, 200, 640, 400, 0x000000, overlayAlpha);
    overlay.setScrollFactor(0);

    // 中央パネル（太枠・直角）
    const panel = scene.add.container(x, y);

    const panelBg = scene.add.rectangle(0, 0, width, height, 0x000000, 0.8);
    const panelBorder = scene.add.rectangle(0, 0, width, height, 0xffffff, 0);
    panelBorder.setStrokeStyle(4, 0xffffff);

    panel.add([panelBg, panelBorder]);
    panel.setScrollFactor(0);

    return { overlay, panel };
  }

  /**
   * メニューアイテムを作成
   */
  static createMenuItems(
    scene: Phaser.Scene,
    options: string[],
    container: Phaser.GameObjects.Container,
    startY: number = -50,
    spacing: number = 40,
    fontSize: string = '20px',
    wordWrapWidth?: number
  ): Phaser.GameObjects.Text[] {
    const menuItems: Phaser.GameObjects.Text[] = [];

    options.forEach((option, index) => {
      const style: Phaser.Types.GameObjects.Text.TextStyle = {
        fontSize: fontSize,
        fontFamily: 'DotGothic16, sans-serif',
        color: '#ffffff',
        backgroundColor: 'rgba(0,0,0,0)',
        padding: { x: 10, y: 5 }
      };

      if (wordWrapWidth) {
        style.wordWrap = { width: wordWrapWidth, useAdvancedWrap: true };
      }

      const menuText = scene.add.text(0, startY + (index * spacing), option, style).setOrigin(0.5);

      menuItems.push(menuText);
      container.add(menuText);
    });

    return menuItems;
  }

  /**
   * 選択状態を更新（黄色背景+黒文字+「▶」）
   */
  static updateSelection(
    items: Phaser.GameObjects.Text[],
    selectedIndex: number,
    options: string[]
  ): void {
    items.forEach((item, index) => {
      if (!item || !item.active) return;

      // 現在のスタイルを保持
      const currentStyle = item.style;

      if (index === selectedIndex) {
        // 選択中：黄色背景＋黒文字＋先頭に「▶」
        item.setText(`▶ ${options[index]}`);
        item.setStyle({
          ...currentStyle, // 既存のスタイルをコピー
          backgroundColor: '#ffff00',
          color: '#000000',
          padding: { x: 10, y: 5 }
        });
      } else {
        // 非選択：透明背景＋白文字
        item.setText(options[index]);
        item.setStyle({
          ...currentStyle, // 既存のスタイルをコピー
          backgroundColor: 'rgba(0,0,0,0)',
          color: '#ffffff',
          padding: { x: 10, y: 5 }
        });
      }
    });
  }

  /**
   * タイトルテキストを作成
   */
  static createTitle(
    scene: Phaser.Scene,
    container: Phaser.GameObjects.Container,
    text: string,
    y: number = -100,
    fontSize: string = '32px',
    color: string = '#ffffff'
  ): Phaser.GameObjects.Text {
    const titleText = scene.add.text(0, y, text, {
      fontSize: fontSize,
      fontFamily: 'DotGothic16, sans-serif',
      color: color
    }).setOrigin(0.5);

    container.add(titleText);
    return titleText;
  }

  /**
   * 説明テキストを作成
   */
  static createInstructionText(
    scene: Phaser.Scene,
    container: Phaser.GameObjects.Container,
    text: string,
    y: number = 100,
    fontSize: string = '12px',
    color: string = '#cccccc',
    wordWrapWidth?: number
  ): Phaser.GameObjects.Text {
    const style: Phaser.Types.GameObjects.Text.TextStyle = {
      fontSize: fontSize,
      fontFamily: 'DotGothic16, sans-serif',
      color: color,
      align: 'center'
    };

    if (wordWrapWidth) {
      style.wordWrap = { width: wordWrapWidth, useAdvancedWrap: true };
    }

    const instructionText = scene.add.text(0, y, text, style).setOrigin(0.5);

    container.add(instructionText);
    return instructionText;
  }

  /**
   * 汎用的なテキストを作成（DotGothic16フォントをデフォルトで適用）
   */
  static createSimpleText(
    scene: Phaser.Scene,
    x: number,
    y: number,
    text: string,
    style?: Phaser.Types.GameObjects.Text.TextStyle
  ): Phaser.GameObjects.Text {
    const defaultStyle: Phaser.Types.GameObjects.Text.TextStyle = {
      fontFamily: 'DotGothic16, sans-serif',
      color: '#ffffff', // デフォルトの色
      fontSize: '16px', // デフォルトのフォントサイズ
      wordWrap: { width: 484 }, // useAdvancedWrapをデフォルトから削除
      lineSpacing: 5 // 行間を確保
    };
    const mergedStyle = { ...defaultStyle, ...style };
    return scene.add.text(x, y, text, mergedStyle);
  }
}
