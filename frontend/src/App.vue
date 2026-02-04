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

const newId = ref('')
const newMessage = ref('')
const newDate = ref('')

function addLeftRecord() {
  const id = newId.value.trim()
  const message = newMessage.value.trim()
  let date = newDate.value.trim()
  if (!id || !message) return
  if (!date) {
    date = new Date().toISOString().slice(0, 19)
  } else if (date.length === 16) {
    date = `${date}:00`
  }
  leftData.value = [...leftData.value, { id, message, date }]
  newId.value = ''
  newMessage.value = ''
  newDate.value = ''
}

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
      <div class="flex flex-1 flex-col gap-4 rounded-lg border border-default bg-default p-4">
        <div class="rounded-lg border border-accented bg-elevated/50 p-3">
          <p class="mb-3 text-sm font-medium text-muted">Новая запись</p>
          <div class="flex flex-wrap items-end gap-2">
            <UFormField label="ID" class="min-w-0 flex-1 basis-20">
              <UInput v-model="newId" placeholder="ID" size="sm" />
            </UFormField>
            <UFormField label="Сообщение" class="min-w-0 flex-1 basis-40">
              <UInput v-model="newMessage" placeholder="Сообщение" size="sm" />
            </UFormField>
            <UFormField label="Дата" class="min-w-0 flex-1 basis-44">
              <UInput
                v-model="newDate"
                type="datetime-local"
                placeholder="Дата"
                size="sm"
              />
            </UFormField>
            <UButton
              label="Добавить"
              size="sm"
              icon="i-lucide-plus"
              :disabled="!newId.trim() || !newMessage.trim()"
              @click="addLeftRecord"
            />
          </div>
        </div>
        <DataTable
          :data="leftData"
          title="Исходная таблица"
          @select="onLeftSelect"
        />
      </div>
      <div class="flex flex-1 flex-col rounded-lg border border-default bg-default p-4">
        <DataTable
          v-model:data="rightData"
          title="Перенесённые строки"
          draggable
          @select="onRightSelect"
        />
      </div>
    </div>
  </UApp>
</template>

<style scoped></style>
