/**
 * Documents expected list styling hooks for the markdown editor.
 * Regression guard for task-list vertical spacing and ordered-list indent.
 */

import fs from 'fs';
import path from 'path';

const stylePath = path.join(__dirname, 'style.scss');
const styles = fs.readFileSync(stylePath, 'utf8');

describe('markdown editor list styles', () => {
  it('removes vertical margin on direct task list items only', () => {
    expect(styles).toMatch(
      /ul\[data-type=['"]taskList['"]\]\s*>\s*li\s*\{[^}]*margin:\s*0/
    );
  });

  it('uses flex on direct task items but list-item on nested ol or bullet li', () => {
    expect(styles).toMatch(
      /ul\[data-type=['"]taskList['"]\][\s\S]*>\s*li\s*\{[^}]*display:\s*flex/
    );
    expect(styles).toMatch(/>\s*ol\s*>\s*li[\s\S]*display:\s*list-item/);
  });

  it('removes default vertical margin on ordered lists in the editor', () => {
    expect(styles).toMatch(/ol\s*\{[^}]*margin:\s*0/);
    expect(styles).toMatch(/ol\s*\{[^}]*padding-left/);
  });

  it('tightens line-height on list item paragraphs', () => {
    expect(styles).toMatch(/li\s*>\s*p[\s\S]*line-height:\s*1\.15/);
  });
});
