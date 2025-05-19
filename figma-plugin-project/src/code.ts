/// <reference types="@figma/plugin-typings" />

figma.showUI(__html__, { width: 240, height: 150 });

figma.ui.onmessage = async (msg) => {
  if (msg.type === 'create-rectangles') {
    const nodes: SceneNode[] = [];
    
    // 创建3个不同颜色的矩形
    const colors = [
      { r: 1, g: 0, b: 0 },    // 红色
      { r: 0, g: 1, b: 0 },    // 绿色
      { r: 0, g: 0, b: 1 }     // 蓝色
    ];

    for (let i = 0; i < 3; i++) {
      const rect = figma.createRectangle();
      rect.x = i * 150;
      rect.y = 0;
      rect.resize(100, 100);
      rect.fills = [{ type: 'SOLID', color: colors[i] }];
      
      // 添加一些效果
      rect.effects = [
        {
          type: 'DROP_SHADOW',
          color: { r: 0, g: 0, b: 0, a: 0.25 },
          offset: { x: 0, y: 4 },
          radius: 4,
          visible: true,
          blendMode: 'NORMAL'
        }
      ];

      // 添加圆角
      rect.cornerRadius = 8;

      figma.currentPage.appendChild(rect);
      nodes.push(rect);
    }

    // 选中创建的矩形并将视图居中到这些矩形
    figma.currentPage.selection = nodes;
    figma.viewport.scrollAndZoomIntoView(nodes);

    // 显示成功消息
    figma.notify('已成功创建3个矩形！');
  }

  // 不要关闭插件，让用户可以继续创建矩形
  // figma.closePlugin();
}; 