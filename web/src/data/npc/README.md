# NPC 内容贡献指南

## 目录结构

```
src/npc/
├── yu/              # 组员 A 负责
│   ├── dialogue/    # 对话片段（Act II 场景中 NPC 的台词）
│   ├── backstory/    # 背景补充（可解锁的背景细节）
│   └── lines/        # 零散台词模板
├── licht/            # 组员 B 负责
│   ├── dialogue/
│   ├── backstory/
│   └── lines/
└── huan/            # 组员 C 负责
    ├── dialogue/
    ├── backstory/
    └── lines/
```

---

## 贡献规则

### ✅ 可以做的

1. 在自己的 NPC 目录下新建文件
2. 修改自己 NPC 目录下的文件
3. 在 `dialogue/` 下按事件命名文件（如 `act2_revelation.md`）
4. 完成后在群里通知

### ❌ 禁止做的

1. 不要修改别人的 NPC 目录
2. 不要修改 `scenes/shared/` 下的主线框架
3. 不要修改 `SKILL.md`、`src/scenes/` 下的既有文件

---

## 文件命名规范

```
act2_{事件名}.md        # Act II 对话
act3_{事件名}.md        # Act III 对话
backstory_{主题}.md     # 背景补充
lines_{场景}.md         # 零散台词
```

---

## 完成后通知格式

群通知示例：

```
[焕] Act II 对话已完成
- 新增文件：src/npc/huan/dialogue/act2_revelation.md
- 新增文件：src/npc/huan/dialogue/act2_huan_choice.md
- 备注：焕的真相分三段讲述，按顺序触发
```

---

## 内容合并

当你完成后，在 GitHub 发起 PR 或告知 Kaci（项目统筹）合入。
