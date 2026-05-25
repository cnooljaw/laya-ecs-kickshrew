import { describe, it, expect } from 'vitest';
import {
  parsePointStr,
  parseRectStr,
  parsePlistXml,
  convertPlistToAtlas,
} from '../../resource/PlistConverter';

describe('PlistConverter', () => {
  // ---- 解析工具函数 ----

  describe('parsePointStr', () => {
    it('解析 {100,50} 格式', () => {
      expect(parsePointStr('{100,50}')).toEqual({ w: 100, h: 50 });
    });

    it('解析带空格的 { 128 , 256 }', () => {
      expect(parsePointStr('{ 128 , 256 }')).toEqual({ w: 128, h: 256 });
    });

    it('解析 {0,0}', () => {
      expect(parsePointStr('{0,0}')).toEqual({ w: 0, h: 0 });
    });
  });

  describe('parseRectStr', () => {
    it('解析 {{2,2},{96,28}} 格式', () => {
      expect(parseRectStr('{{2,2},{96,28}}')).toEqual({
        x: 2, y: 2, w: 96, h: 28,
      });
    });

    it('解析 {{0,0},{94,110}}', () => {
      expect(parseRectStr('{{0,0},{94,110}}')).toEqual({
        x: 0, y: 0, w: 94, h: 110,
      });
    });

    it('解析带空格的 {{ 242 , 224 },{ 97 , 578 }}', () => {
      expect(parseRectStr('{{ 242 , 224 },{ 97 , 578 }}')).toEqual({
        x: 242, y: 224, w: 97, h: 578,
      });
    });
  });

  // ---- plist XML 解析 ----

  describe('parsePlistXml', () => {
    const sampleXml = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple Computer//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
    <dict>
        <key>frames</key>
        <dict>
            <key>dizzy_star1.png</key>
            <dict>
                <key>frame</key>
                <string>{{2,2},{96,28}}</string>
                <key>offset</key>
                <string>{-1,-4}</string>
                <key>rotated</key>
                <false/>
                <key>sourceColorRect</key>
                <string>{{1,15},{96,28}}</string>
                <key>sourceSize</key>
                <string>{100,50}</string>
            </dict>
            <key>dizzy_star4.png</key>
            <dict>
                <key>frame</key>
                <string>{{100,2},{94,26}}</string>
                <key>offset</key>
                <string>{1,1}</string>
                <key>rotated</key>
                <true/>
                <key>sourceColorRect</key>
                <string>{{4,11},{94,26}}</string>
                <key>sourceSize</key>
                <string>{100,50}</string>
            </dict>
        </dict>
        <key>metadata</key>
        <dict>
            <key>format</key>
            <integer>2</integer>
            <key>realTextureFileName</key>
            <string>shrew_dizzy_star.png</string>
            <key>size</key>
            <string>{128,256}</string>
            <key>textureFileName</key>
            <string>shrew_dizzy_star.png</string>
        </dict>
    </dict>
</plist>`;

    it('解析帧数量', () => {
      const result = parsePlistXml(sampleXml);
      expect(Object.keys(result.frames).length).toBe(2);
    });

    it('解析非旋转帧的字段', () => {
      const result = parsePlistXml(sampleXml);
      const frame = result.frames['dizzy_star1.png'];
      expect(frame).toEqual({
        frame: { x: 2, y: 2, w: 96, h: 28 },
        offset: { x: -1, y: -4 },
        rotated: false,
        sourceColorRect: { x: 1, y: 15, w: 96, h: 28 },
        sourceSize: { w: 100, h: 50 },
      });
    });

    it('解析旋转帧的字段', () => {
      const result = parsePlistXml(sampleXml);
      const frame = result.frames['dizzy_star4.png'];
      expect(frame.rotated).toBe(true);
      expect(frame.frame).toEqual({ x: 100, y: 2, w: 94, h: 26 });
    });

    it('解析 metadata', () => {
      const result = parsePlistXml(sampleXml);
      expect(result.meta.textureFileName).toBe('shrew_dizzy_star.png');
      expect(result.meta.size).toEqual({ w: 128, h: 256 });
    });
  });

  // ---- 转换为 Laya atlas 格式 ----

  describe('convertPlistToAtlas', () => {
    const sampleXml = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple Computer//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
    <dict>
        <key>frames</key>
        <dict>
            <key>red_body.png</key>
            <dict>
                <key>frame</key>
                <string>{{2,2},{94,110}}</string>
                <key>offset</key>
                <string>{0,0}</string>
                <key>rotated</key>
                <false/>
                <key>sourceColorRect</key>
                <string>{{0,0},{94,110}}</string>
                <key>sourceSize</key>
                <string>{94,110}</string>
            </dict>
            <key>red_ear_left_down.png</key>
            <dict>
                <key>frame</key>
                <string>{{167,31},{27,46}}</string>
                <key>offset</key>
                <string>{0,0}</string>
                <key>rotated</key>
                <true/>
                <key>sourceColorRect</key>
                <string>{{4,0},{27,46}}</string>
                <key>sourceSize</key>
                <string>{35,46}</string>
            </dict>
        </dict>
        <key>metadata</key>
        <dict>
            <key>format</key>
            <integer>2</integer>
            <key>realTextureFileName</key>
            <string>kickshrew_role_red.png</string>
            <key>size</key>
            <string>{256,256}</string>
            <key>textureFileName</key>
            <string>kickshrew_role_red.png</string>
        </dict>
    </dict>
</plist>`;

    it('转换后 frames 键名去掉 .png 后缀', () => {
      const atlas = convertPlistToAtlas(sampleXml);
      expect(atlas.frames).toHaveProperty('red_body');
      expect(atlas.frames).not.toHaveProperty('red_body.png');
    });

    it('非旋转帧的 frame 字段正确映射', () => {
      const atlas = convertPlistToAtlas(sampleXml);
      const frame = atlas.frames['red_body'];
      expect(frame.frame).toEqual({ x: 2, y: 2, w: 94, h: 110 });
      expect(frame.rotated).toBe(false);
      expect(frame.spriteSourceSize).toEqual({ x: 0, y: 0, w: 94, h: 110 });
      expect(frame.sourceSize).toEqual({ w: 94, h: 110 });
    });

    it('旋转帧的 frame 正确映射', () => {
      const atlas = convertPlistToAtlas(sampleXml);
      const frame = atlas.frames['red_ear_left_down'];
      expect(frame.frame).toEqual({ x: 167, y: 31, w: 27, h: 46 });
      expect(frame.rotated).toBe(true);
      expect(frame.spriteSourceSize).toEqual({ x: 4, y: 0, w: 27, h: 46 });
      expect(frame.sourceSize).toEqual({ w: 35, h: 46 });
    });

    it('meta 字段正确映射', () => {
      const atlas = convertPlistToAtlas(sampleXml);
      expect(atlas.meta.image).toBe('kickshrew_role_red.png');
      expect(atlas.meta.size).toEqual({ w: 256, h: 256 });
    });

    it('trimmed 标记：sourceSize != frame 时为 true', () => {
      const atlas = convertPlistToAtlas(sampleXml);
      // red_body: sourceSize==frame → trimmed=false
      expect(atlas.frames['red_body'].trimmed).toBe(false);
      // red_ear_left_down: sourceSize 35x46 != frame 27x46 → trimmed=true
      expect(atlas.frames['red_ear_left_down'].trimmed).toBe(true);
    });
  });
});
