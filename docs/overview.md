# SnapKeep – Full Application Overview

## Overview

SnapKeep is a fully offline, privacy-first mobile application designed to help users store, organize, search, and interact with their personal files using local AI. The app runs entirely on the device and does not send any user data outside the phone. It focuses on documents, PDFs, images, screenshots, and notes, allowing users to retrieve information and ask questions based only on their own stored data.

The core idea is simple: everything becomes searchable and understandable through text, tags, metadata, and local reasoning.

---

## High-Level Application Structure

SnapKeep is organized into five tightly integrated layers:

1. UI and Navigation Layer
2. Data and Storage Layer
3. Indexing and Retrieval Layer (RAG)
4. Local AI Reasoning Layer
5. Security and Privacy Layer

Each layer has a clear responsibility and works independently while supporting the others.

---

## UI and Navigation Layer

The app uses a clean mobile layout with bottom navigation.

### Main Screens

• Onboarding
• Browse
• Upload
• Chat
• Settings
• App Lock Screen

### Onboarding

On first launch, SnapKeep explains its purpose and offline nature. The user sets a passcode and can optionally enable biometric authentication. The app clearly communicates local storage usage and model size requirements if the local AI model is enabled. There is no account creation and no cloud login.

---

## Upload and Ingestion Flow

Uploading is the primary action in SnapKeep.

### Upload Options

• Upload file from device storage
• Capture image (future extension)

After upload, the user can:

• Add tags
• Add a short description or note
• Select a category such as bill, receipt, ID, certificate, or note

This user-provided context replaces cloud OCR and ensures the system remains fully offline.

---

## Data Model and Local Storage

All data is stored locally and encrypted.

### Core Data Objects

**Document**
• id
• name
• file type
• file path
• created date
• user tags
• user notes
• auto tags
• extracted or provided text
• structured fields such as date, amount, or status

**Chunk**
• chunk id
• document id
• chunk text
• metadata including tags, file type, and position

**Embedding**
• vector representation of each chunk

### Storage Systems

• Files stored in the app filesystem
• Metadata and mappings stored in encrypted SQLite
• Vector index stored locally
• AI models stored locally

No data leaves the device.

---

## Browse and File Organization

The Browse tab represents the user’s personal library.

### Automatic Grouping

Files are grouped by type:

• Images
• PDFs
• Documents
• Notes
• Other

Groups are expandable and collapsible.

### Search

Search is instant and fully local. It works across:

• File names
• User notes
• Tags
• Metadata
• Embedded text

Search can also be scoped to specific folders or file groups.

---

## File Preview and Management

Selecting a file opens a detailed preview.

### Preview Includes

• File thumbnail or preview
• User notes and tags
• Extracted or provided text
• Structured fields like amount, date, or status
• Open or share action

### Management Actions

• Rename
• Edit tags
• Edit notes
• Delete
• Move to folder

Bulk actions are supported for efficiency.

---

## Local RAG Search System

This is the intelligence core of SnapKeep.

### How RAG Works

1. Every document is converted into text
2. Text is split into logical chunks
3. Each chunk is embedded using a small local embedding model
4. Embeddings are stored in a local vector index

### Query Flow

1. User query is embedded
2. Vector search retrieves relevant chunks
3. Results are reranked using tags, recency, and metadata
4. The best chunks are selected as context

All steps happen offline.

---

## Context Compression

To fit mobile constraints:

• Long chunks are shortened
• Duplicate text is removed
• Only the most relevant sentences are retained
• References are preserved

This keeps prompts small and efficient.

---

## Local AI Reasoning and Chat

SnapKeep includes a fully offline local language model.

### Local LLM Responsibilities

• Read retrieved context
• Combine information across documents
• Answer questions
• Summarize content
• Explain results clearly

The model never uses external knowledge. It only reasons over user data.

### Chat Experience

• Threaded conversation view
• Streaming responses
• Short, clear answers
• Sources listed under each answer
• Tapping a source opens the file preview

---

## Planner and Bills Logic

SnapKeep provides lightweight planning features built on document data.

### Bills and Payments

• Bills can be marked as paid or unpaid
• Due dates can be added manually
• Amounts are stored as structured fields

### Planner View

• Upcoming bills
• Overdue bills
• Monthly totals
• Payment history

This logic is deterministic and rule-based.

---

## Settings and Customization

Settings give users full control.

### Settings Options

• Enable or disable local AI
• Manage AI model storage
• Rebuild search index
• Enable dark mode
• Enable biometric lock
• Export encrypted data
• Reset application

The app version is displayed clearly.

---

## Security and Privacy

Privacy is a core design principle.

### Security Features

• Local-only storage
• Encrypted database
• Secure file storage
• Passcode and biometric protection
• No background uploads
• No analytics by default

SnapKeep works fully offline at all times.

---

## Performance Characteristics

• Fast local search
• Background indexing
• Streaming AI responses
• Graceful fallback on low-memory devices
• Retrieval-only mode if AI is disabled

---

## Design Principles

• Offline first
• Privacy first
• Simple inputs with strong retrieval
• Small models with smart pipelines
• Deterministic answers
• No cloud dependency

---

## Summary

SnapKeep is a local knowledge vault with offline AI. It securely stores files, converts them into searchable text, retrieves relevant information using embeddings, and answers questions using a small on-device language model. The intelligence comes from solid data modeling and retrieval rather than large cloud-based systems, making SnapKeep fast, private, and reliable.
