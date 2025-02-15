

# agent追加関連
- agentの追加の仕方
  - GraphAIのAgentをGUI上のAgentをmappingするデータがある
    - src/utils/gui/data.ts 
- meta agentについて
  - GraphAI GUIでは、GraphAIの１つのagentをGUI上で別のagentとして扱うことができる。たとえば、copyAgentのinputsの構造をそれぞれ用意して、templateのように使うことが出来る。
  - GUI上では、convertAgentというメタエージェントになり、GraphDataではcopyAgentとなり、copyAgentが実行される
  - GUIからGraphAIデータに変換するときに、inputSchemaを使って構造を持ったinputsを生成する
  - inputSchemaがない場合は、GUI上の項目だけをflatにrecordとして展開される
  - この変換デーブルをメンテすることで、GUI上のagent(node)を管理することができる。
  - paramsのdefault値などもここにいれる予定。
  - この仕組みがある理由は
    - ユーザに複雑な設定をさせない
    - inputsは、edgeを接続させるだけなので、inputsのデータ構造を編集できない（させない）ため。

- inputs/outputsの指定方法

# agent関連実装周り
 - inputs/outputsの制限方法
   - TODO的なこと
     - array
     - props
     - 接続できるもの、出来ないものを明確にし実装していく
     - 出来ない場合はUIで表現する
     - できれば、出来ない理由をテキストで教えてあげたい。

# paramsの利用
  paramsはagentで使うデータであるが不要なデータを入れても、agent側で変な実装をしていない限り、無視される
  isResultなどのユーザの入力させる値は、paramsを利用して保存しておいて、GraphDataに変換するときにnodeの値としてセットする

# GraphAIとのintegrate
  - streamやresultを動的に指定させたい。
  - streamはconfigで強制true. result がtrue && stream対応nodeはstream agent filterの対象する
  - isResultは、paramsをみる(result自体は使わないがstream のために必要なはなず）

# データ保存/読み込みについて
- demo guiはlocal storageに１つのgraph dataだけ保存している。string <-> json 

# GUIのメタデータ
- GraphData.metadataに格納する
  - ここにposition dataが入っている
  - 他にGUIに必要で、GraphAIで不要なものはここにいれる
  

# 履歴について
- Computed Nodeのparamsの値、static nodeのvalueが肝
  - formの値をデータ読み込みの値をhistoryで正しく制御する必要がある
  - データ更新時にformが発火すると、それによって履歴が積まれるので、そうならないような実装
  - undo/redoで、store側のデータを更新したときに、正しくformを更新する必要がある
  - さらにformでは、string <-> (number, data(json), boolean)のcastがある
  - data(json)はinvalid formatのときにはstring, validなときにはjson.parseして扱う
  - dataはarrrayとobjectがある（これはあまり意識しなくてもよい？）
- agentを追加したときにdefault値をセットする
- GraphDataを読み込んだときに、その値を正しくセットさせる
  - 
- nodeのpositionは、onDrag中はstoreのデータは更新するが、historyのはpushしない。
  - dragが終わったタイミングでpushする（が、たしか、end eventではpositionが取れないので注意）

# Drag event
- nodeのdrag eventはwindow全体で取っている。
  - なので、どこにでも自由に動かせる＝見えなくなる<undoで戻せる
  - 枠を小さくすると、境界でうまく動かない（はず）


# context menu
- 現在、node/edgeの削除でcontext menuを使っている
- context menuを開いた状態でどこかをクリックするとcloseしてしまうので、button以外の実装が出来ない
- この問題を直して、context menuをもう少しリッチに(例えば、nodeIdの変更)したい