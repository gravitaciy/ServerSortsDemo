<script setup lang="ts">
import { ref } from 'vue'
import DataTable from '@/components/DataTable.vue'
import type { TableRow } from '@/components/DataTable.vue'

const leftData = ref<TableRow[]>([
  { id: '1', message: 'First message', date: '2024-01-15T10:00:00' },
  { id: '2', message: 'Second message', date: '2024-02-20T14:30:00' },
  { id: '3', message: 'Third message', date: '2024-03-10T09:15:00' },
  { id: '4', message: 'Fourth message', date: '2024-04-05T16:45:00' },
  { id: '5', message: 'Fifth message', date: '2024-05-12T11:20:00' },
  { id: '6', message: 'Sixth message', date: '2024-06-01T08:00:00' },
  { id: '7', message: 'Seventh message', date: '2024-07-18T13:00:00' },
  { id: '8', message: 'Eighth message', date: '2024-08-22T17:30:00' },
])

const rightData = ref<TableRow[]>([])

function onLeftSelect(_e: Event, row: { original: TableRow }) {
  const item = row.original
  leftData.value = leftData.value.filter((r) => r.id !== item.id)
  rightData.value = [...rightData.value, { ...item }]
}

function onRightSelect(_e: Event, row: { original: TableRow }) {
  const item = row.original
  rightData.value = rightData.value.filter((r) => r.id !== item.id)
  leftData.value = [...leftData.value, { ...item }]
}
</script>

<template>
  <UApp>
    <div class="flex h-screen w-full gap-4 p-4">
      <div class="flex flex-1 flex-col rounded-lg border border-default bg-default p-4">
        <DataTable
          :data="leftData"
          title="Исходная таблица"
          @select="onLeftSelect"
        />
      </div>
      <div class="flex flex-1 flex-col rounded-lg border border-default bg-default p-4">
        <DataTable
          :data="rightData"
          title="Перенесённые строки"
          @select="onRightSelect"
        />
      </div>
    </div>
  </UApp>
</template>

<style scoped></style>
