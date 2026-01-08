<template>
  <ejs-gantt 
    ref="ganttRef"
    :dataSource="ganttItems"
    :treeColumnIndex="1"
    :taskFields="taskFields"
    @rowSelected="onRowSelected"
  >
    <e-columns>
      <e-column field="TaskID" headerText="Task ID" textAlign="Right" width="70"></e-column>
      <e-column field="TaskName" headerText="Task Name" textAlign="Left" width="200"></e-column>
      <e-column field="StartDate" headerText="Start Date" textAlign="Right" format="yMd" width="90"></e-column>
      <e-column field="Duration" headerText="Duration" textAlign="Right" width="80"></e-column>
    </e-columns>
  </ejs-gantt>
</template>

<script setup lang="ts">
import { computed } from 'vue';
interface Card {
  _id: string;
  "card-title": string;
  "start-date": string;
  "end-date"?: string;
  "card-status": string;
  "card-code": string;
}

const props = defineProps<{ data: Card[] }>();
const lightColors = [
  '#DBEAFE', '#DCFCE7', '#FEF3C7',
  '#FCE7F3', '#EDE9FE', '#ECFEFF', '#FFE4E6',
];

const taskFields = {
  id: 'TaskID',
  name: 'TaskName',
  startDate: 'StartDate',
  endDate: 'EndDate',
  duration: 'Duration',
  progress: 'Progress',
  child: 'subtasks'
};

const ganttItems = computed(() => 
  props.data.map((card, index) => {
    const start = new Date(card['start-date']);
    const end = card['end-date'] ? new Date(card['end-date']) : start;
    const duration = Math.ceil((end.getTime() - start.getTime()) / (1000*60*60*24)) || 1;
    const color = lightColors[index % lightColors.length];

    return {
      TaskID: card._id,
      TaskName: card['card-title'],
      StartDate: start,
      EndDate: end,
      Duration: duration,
      Progress: 0,
      barColor: color,
      foreground: '#374151',
      extendedProps: { card },
    };
  })
);
const emit = defineEmits<{
  (e: "select:ticket", card: Card): void;
}>();
const onRowSelected = (args: any) => {
  const card = args.data.extendedProps.card as Card;
  emit("select:ticket", card);
};
</script>

