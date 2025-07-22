"use client";

import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { DraggableWidget } from './DraggableWidget';

interface SortableWidgetProps {
  id: string;
  title: string;
  children: React.ReactNode;
  isVisible?: boolean;
}

export function SortableWidget({ id, title, children, isVisible = true }: SortableWidgetProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 1000 : 1,
  };

  return (
    <div 
      ref={setNodeRef} 
      style={style} 
      className="col-span-12 md:col-span-6 lg:col-span-4 xl:col-span-3"
      {...attributes}
      {...listeners}
    >
      <DraggableWidget id={id} title={title} isVisible={isVisible}>
        {children}
      </DraggableWidget>
    </div>
  );
}