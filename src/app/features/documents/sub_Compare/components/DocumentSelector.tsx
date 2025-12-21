
'use client';

import React, { memo } from 'react';
import { FileText } from 'lucide-react';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';

export interface DocumentOption {
    id: string;
    name: string;
}

interface DocumentSelectorProps {
    label: string;
    value: string;
    onChange: (value: string) => void;
    documents: DocumentOption[];
    disabledId?: string;
    testId?: string;
}

export const DocumentSelector = memo(function DocumentSelector({
    label,
    value,
    onChange,
    documents,
    disabledId,
    testId,
}: DocumentSelectorProps) {
    return (
        <div className="flex-1">
            <label className="text-sm font-medium text-zinc-700 mb-2 block" data-testid={`${testId}-label`}>
                {label}
            </label>
            <Select value={value} onValueChange={onChange}>
                <SelectTrigger className="transition-shadow hover:shadow-sm" data-testid={`${testId}-trigger`}>
                    <SelectValue placeholder="Select document" />
                </SelectTrigger>
                <SelectContent>
                    {documents.length === 0 ? (
                        <div className="px-2 py-3 text-sm text-zinc-500 text-center" data-testid={`${testId}-empty`}>
                            No documents available
                        </div>
                    ) : (
                        documents.map((doc) => (
                            <SelectItem
                                key={doc.id}
                                value={doc.id}
                                disabled={doc.id === disabledId}
                                data-testid={`${testId}-option-${doc.id}`}
                            >
                                <div className="flex items-center gap-2">
                                    <FileText className="w-4 h-4 text-zinc-400" />
                                    <span>{doc.name}</span>
                                </div>
                            </SelectItem>
                        ))
                    )}
                </SelectContent>
            </Select>
        </div>
    );
});
