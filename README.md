# ResumeForge – NLP Resume Annotation and Information Extraction Platform

ResumeForge is an end-to-end NLP dataset annotation and resume information extraction system. It enables construction of annotated resume datasets using Label Studio, trains a Named Entity Recognition (NER) model, and provides a dashboard where users upload resumes and automatically extract structured information such as Name, Skills, Organization, Education, Location, and Email.

This project demonstrates real-world language data annotation, dataset engineering, and NLP pipeline deployment workflows.

---

# Core Functionality

- Annotate resume text using Label Studio with custom entity labels
- Convert annotations into structured NLP training datasets
- Train a custom Named Entity Recognition (NER) model on annotated data
- Deploy trained model using FastAPI backend for real-time inference
- Provide a Streamlit dashboard to upload resumes and auto-extract structured information
- Automatically populate structured form fields from extracted entities

---

# Technology Stack and Purpose

## Annotation Layer
**Label Studio**
- Used for manual annotation of resume text
- Defines entity labels such as NAME, SKILL, ORGANIZATION, EDUCATION, LOCATION, EMAIL
- Exports structured annotation dataset in JSON format

---

## Data Processing Layer
**Python, Pandas, JSON**
- Preprocess annotated dataset
- Convert Label Studio output into structured training format
- Validate and clean annotation data
- Prepare dataset for model training

---

## NLP Model Layer
**spaCy / HuggingFace Transformers, scikit-learn**
- Train Named Entity Recognition (NER) model on annotated resume dataset
- Learn entity extraction patterns from labeled data
- Perform entity extraction during inference

---

## Backend Layer
**FastAPI**
- Provides REST API for resume processing
- Accepts resume text input
- Runs NLP model inference
- Returns structured entity output

---

## Frontend Layer
**Streamlit**
- Provides web dashboard interface
- Allows resume upload or text input
- Displays extracted structured information
- Shows auto-filled form fields

---

## Visualization Layer
**Matplotlib / Plotly**
- Displays dataset statistics
- Visualizes entity distribution
- Supports model output analysis

---

# System Workflow

1. Collect raw resume text data  
2. Annotate resume entities using Label Studio  
3. Export annotated dataset  
4. Preprocess and convert dataset using Python pipeline  
5. Train Named Entity Recognition model  
6. Deploy model using FastAPI backend  
7. Upload resume through Streamlit dashboard  
8. Extract and display structured information  

---

# Project Structure
