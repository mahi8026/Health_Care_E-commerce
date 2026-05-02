require('dotenv').config();
const mongoose = require('mongoose');
const Product = require('../models/Product');
const Manufacturer = require('../models/Manufacturer');
const Category = require('../models/Category');
const logger = require('../utils/logger');

// All products data embedded
const productsData = [
  // eBcare - 8 products
  {name:"eBcare EDTA Blood Collection Tube K3 2ml",brand:"eBcare",manufacturer:"Taiwan",category:"Diagnostic Equipment",sku:"EBCARE-EDTA-K3-2ML-100",description:"Vacuum blood collection tube with K3 EDTA anticoagulant. Lavender cap. For CBC and hematology tests.",specifications:{"Anticoagulant":"K3 EDTA","Volume":"2 mL","Cap Color":"Lavender/Purple","Tube":"PET plastic","Pack Size":"100 tubes/box","Dimensions":"13 x 75 mm","Origin":"Taiwan"},certifications:["CE IVD","ISO 13485"],price:600,stock:50,minOrderQty:1,tags:["EDTA tube","blood collection","vacuum tube","CBC","eBcare"],isActive:true,isFeatured:true},
  {name:"eBcare Clot Activator Blood Collection Tube 4ml",brand:"eBcare",manufacturer:"Taiwan",category:"Diagnostic Equipment",sku:"EBCARE-CLOT-ACT-4ML-100",description:"Vacuum blood collection tube with clot activator. Red/Gold cap. For serum biochemistry and serology tests.",specifications:{"Additive":"Clot Activator","Volume":"4 mL","Cap Color":"Red/Gold","Pack Size":"100 tubes/box","Dimensions":"13 x 75 mm","Origin":"Taiwan"},certifications:["CE IVD"],price:600,stock:50,minOrderQty:1,tags:["clot activator","serum tube","blood collection","eBcare"],isActive:true,isFeatured:false},
  {name:"eBcare EDTA Blood Collection Tube K2 3ml",brand:"eBcare",manufacturer:"Taiwan",category:"Diagnostic Equipment",sku:"EBCARE-EDTA-K2-3ML-100",description:"K2 EDTA vacuum tube for hematology. Lavender cap.",specifications:{"Anticoagulant":"K2 EDTA","Volume":"3 mL","Pack Size":"100 tubes/box","Dimensions":"13 x 75 mm","Origin":"Taiwan"},certifications:["CE IVD"],price:600,stock:50,minOrderQty:1,tags:["K2 EDTA","blood collection","vacuum tube","eBcare"],isActive:true,isFeatured:false},
  {name:"eBcare Glucose (Fluoride) Blood Collection Tube 3ml",brand:"eBcare",manufacturer:"Taiwan",category:"Diagnostic Equipment",sku:"EBCARE-GLUCOSE-FL-3ML-100",description:"NaF/KOx (Fluoride/Oxalate) vacuum tube for blood glucose testing. Grey cap.",specifications:{"Additive":"NaF + KOx (Fluoride/Oxalate)","Volume":"3 mL","Cap Color":"Grey","Use":"Blood glucose, GTT","Pack Size":"100 tubes/box","Origin":"Taiwan"},certifications:["CE IVD"],price:950,stock:40,minOrderQty:1,tags:["glucose tube","fluoride tube","NaF","GTT","eBcare"],isActive:true,isFeatured:false},
  {name:"ESR Tube 1.28ml (Glass) 8x120mm",brand:"eBcare",manufacturer:"Taiwan",category:"Diagnostic Equipment",sku:"EBCARE-ESR-GLASS-100",description:"Westergren ESR tube for Erythrocyte Sedimentation Rate measurement. Glass, 1.28ml.",specifications:{"Type":"ESR Westergren tube","Volume":"1.28 mL","Material":"Glass","Dimensions":"8 x 120 mm","Pack Size":"100 tubes/box","Origin":"Taiwan"},certifications:["CE IVD"],price:600,stock:30,minOrderQty:1,tags:["ESR tube","Westergren","glass tube","sedimentation rate","eBcare"],isActive:true,isFeatured:false},
  {name:"Disposable Blood Collection Needle 23G",brand:"eBcare",manufacturer:"Taiwan",category:"PPE & Safety",sku:"EBCARE-NEEDLE-23G-100",description:"Disposable vacutainer needle 23G for blood collection. Single-use sterile.",specifications:{"Gauge":"23G","Type":"Double-ended vacutainer needle","Sterile":"Yes","Pack Size":"100 pcs/box","Origin":"Taiwan"},certifications:["CE IVD"],price:800,stock:50,minOrderQty:1,tags:["needle","vacutainer needle","23G","blood collection","eBcare"],isActive:true,isFeatured:false},
  {name:"eBcare Diabetic Machine Test Strip (25 pcs)",brand:"eBcare",manufacturer:"Taiwan",category:"Laboratory Reagents",sku:"EBCARE-DM-STRIP-25",description:"Blood glucose test strips compatible with eBcare diabetic machine. Pack of 25.",specifications:{"Pack Size":"25 Test Box","Compatibility":"eBcare Diabetic Machine","Origin":"Taiwan"},certifications:["CE IVD"],price:420,stock:60,minOrderQty:1,tags:["glucose strips","diabetic strips","eBcare"],isActive:true,isFeatured:false},
  {name:"eBcare Diabetic Machine Test Strip (50 pcs)",brand:"eBcare",manufacturer:"Taiwan",category:"Laboratory Reagents",sku:"EBCARE-DM-STRIP-50",description:"Blood glucose test strips compatible with eBcare diabetic machine. Economy pack of 50.",specifications:{"Pack Size":"50 Test Box","Compatibility":"eBcare Diabetic Machine","Origin":"Taiwan"},certifications:["CE IVD"],price:750,stock:50,minOrderQty:1,tags:["glucose strips","diabetic strips","eBcare","50 pack"],isActive:true,isFeatured:false},
  
  // Perfebio - 20 products
  {name:"Perfebio HBsAg Rapid Test Strip",brand:"Perfebio",manufacturer:"Perfebio Technology (Beijing) Co. Ltd., China",category:"Laboratory Reagents",sku:"PFB-HBSAG-STRIP-APJ001",description:"Rapid immunochromatographic test strip for Hepatitis B Surface Antigen (HBsAg) detection. Screening test for Hepatitis B infection.",specifications:{"Test Parameter":"HBsAg (Hepatitis B Surface Antigen)","Format":"Strip","Specimen":"Serum, Plasma, Whole Blood","Pack Size":"1 x 50 Test Box","Result Time":"15-20 minutes","Sensitivity":">99%","Storage":"4-30°C","Origin":"China"},certifications:["CE IVD"],price:475,stock:30,minOrderQty:1,tags:["HBsAg","hepatitis B","rapid test","perfebio","strip"],isActive:true,isFeatured:true},
  {name:"Perfebio HBsAg Rapid Test Card",brand:"Perfebio",manufacturer:"Perfebio Technology (Beijing) Co. Ltd., China",category:"Laboratory Reagents",sku:"PFB-HBSAG-CARD-BPJ001",description:"Rapid immunochromatographic test card for Hepatitis B Surface Antigen (HBsAg) detection.",specifications:{"Test Parameter":"HBsAg","Format":"Card","Specimen":"Serum, Plasma, Whole Blood","Pack Size":"1 x 40 Test Box","Storage":"4-30°C","Origin":"China"},certifications:["CE IVD"],price:600,stock:30,minOrderQty:1,tags:["HBsAg","hepatitis B","rapid test","perfebio","card"],isActive:true,isFeatured:false},
  {name:"Perfebio TP Syphilis Rapid Test Strip",brand:"Perfebio",manufacturer:"Perfebio Technology (Beijing) Co. Ltd., China",category:"Laboratory Reagents",sku:"PFB-TP-SYPH-STRIP-APJ004",description:"Rapid test strip for Treponema Pallidum (Syphilis) antibody detection. Used for syphilis screening.",specifications:{"Test Parameter":"Treponema Pallidum (Syphilis)","Format":"Strip","Specimen":"Serum, Plasma, Whole Blood","Pack Size":"1 x 50 Test Box","Storage":"4-30°C","Origin":"China"},certifications:["CE IVD"],price:625,stock:25,minOrderQty:1,tags:["syphilis","TP","treponema pallidum","rapid test","perfebio"],isActive:true,isFeatured:false},
  {name:"Perfebio TP Syphilis Rapid Test Card",brand:"Perfebio",manufacturer:"Perfebio Technology (Beijing) Co. Ltd., China",category:"Laboratory Reagents",sku:"PFB-TP-SYPH-CARD-BPJ004",description:"Rapid test card for Treponema Pallidum antibody detection.",specifications:{"Test Parameter":"Treponema Pallidum (Syphilis)","Format":"Card","Specimen":"Serum, Plasma, Whole Blood","Pack Size":"1 x 40 Test Box","Storage":"4-30°C"},certifications:["CE IVD"],price:900,stock:25,minOrderQty:1,tags:["syphilis","TP","rapid test card","perfebio"],isActive:true,isFeatured:false},
  {name:"Perfebio HCV Antibody Rapid Test Card",brand:"Perfebio",manufacturer:"Perfebio Technology (Beijing) Co. Ltd., China",category:"Laboratory Reagents",sku:"PFB-HCV-AB-CARD-BPJ002",description:"Rapid immunochromatographic test for Hepatitis C Virus (HCV) antibody detection.",specifications:{"Test Parameter":"HCV Antibody","Format":"Card","Specimen":"Serum, Plasma, Whole Blood","Pack Size":"1 x 40 Test Box","Storage":"4-30°C"},certifications:["CE IVD"],price:1000,stock:20,minOrderQty:1,tags:["HCV","hepatitis C","antibody","rapid test","perfebio"],isActive:true,isFeatured:true},
  {name:"Perfebio HIV 1/2 Antibody Rapid Test Card",brand:"Perfebio",manufacturer:"Perfebio Technology (Beijing) Co. Ltd., China",category:"Laboratory Reagents",sku:"PFB-HIV-AB-CARD-BPJ003",description:"Rapid test card for HIV 1 and HIV 2 antibody detection. Used for HIV screening.",specifications:{"Test Parameter":"HIV 1 & 2 Antibody","Format":"Card","Specimen":"Serum, Plasma, Whole Blood","Pack Size":"1 x 40 Test Box","Sensitivity":">99.5%","Storage":"4-30°C"},certifications:["CE IVD"],price:1000,stock:15,minOrderQty:1,tags:["HIV","HIV 1/2","antibody","rapid test","perfebio"],isActive:true,isFeatured:true},
  {name:"Perfebio H.Pylori Antibody Rapid Test Card",brand:"Perfebio",manufacturer:"Perfebio Technology (Beijing) Co. Ltd., China",category:"Laboratory Reagents",sku:"PFB-HPYLORI-CARD-BPJ005",description:"Rapid test for H. pylori antibody detection. Very common test in Bangladesh due to high prevalence of gastric infection.",specifications:{"Test Parameter":"H. Pylori Antibody","Format":"Card","Specimen":"Serum, Plasma, Whole Blood","Pack Size":"1 x 40 Test Box","Storage":"4-30°C"},certifications:["CE IVD"],price:1880,stock:20,minOrderQty:1,tags:["H. pylori","helicobacter","gastric","rapid test","perfebio"],isActive:true,isFeatured:true},
  {name:"Perfebio Dengue IgG/IgM Rapid Test Card",brand:"Perfebio",manufacturer:"Perfebio Technology (Beijing) Co. Ltd., China",category:"Laboratory Reagents",sku:"PFB-DENGUE-IGGIGM-CARD-BPJ006",description:"Rapid combo test for Dengue IgG and IgM antibodies. Essential for dengue fever diagnosis — highly relevant in Bangladesh.",specifications:{"Test Parameter":"Dengue IgG + IgM","Format":"Card","Specimen":"Serum, Plasma, Whole Blood","Pack Size":"1 x 40 Test Box","Storage":"4-30°C"},certifications:["CE IVD"],price:1800,stock:25,minOrderQty:1,tags:["dengue","IgG","IgM","dengue fever","rapid test","perfebio"],isActive:true,isFeatured:true},
  {name:"Perfebio Dengue NS1 Rapid Test Card",brand:"Perfebio",manufacturer:"Perfebio Technology (Beijing) Co. Ltd., China",category:"Laboratory Reagents",sku:"PFB-DENGUE-NS1-CARD-BPJ009",description:"Rapid test for Dengue NS1 antigen — detects dengue in early acute phase (day 1-5). Highly relevant for Bangladesh dengue season.",specifications:{"Test Parameter":"Dengue NS1 Antigen","Format":"Card","Specimen":"Serum, Plasma, Whole Blood","Pack Size":"1 x 40 Test Box","Detection Window":"Day 1-5 of fever","Storage":"4-30°C"},certifications:["CE IVD"],price:2000,stock:25,minOrderQty:1,tags:["dengue NS1","dengue antigen","early detection","dengue","perfebio"],isActive:true,isFeatured:true},
  {name:"Perfebio IgE Rapid Test Card",brand:"Perfebio",manufacturer:"Perfebio Technology (Beijing) Co. Ltd., China",category:"Laboratory Reagents",sku:"PFB-IGE-CARD-BPJ009",description:"Rapid qualitative test for Total IgE detection. Used for allergy screening.",specifications:{"Test Parameter":"IgE (Total)","Format":"Card","Specimen":"Serum, Plasma, Whole Blood","Pack Size":"1 x 40 Test Box","Storage":"4-30°C"},certifications:["CE IVD"],price:3000,stock:15,minOrderQty:1,tags:["IgE","allergy","rapid test","perfebio"],isActive:true,isFeatured:false},
  {name:"Perfebio Malaria pf/pv Rapid Test Card",brand:"Perfebio",manufacturer:"Perfebio Technology (Beijing) Co. Ltd., China",category:"Laboratory Reagents",sku:"PFB-MALARIA-PFPV-CARD-BPJ013",description:"Rapid combo test for Malaria P. falciparum and P. vivax antigen detection.",specifications:{"Test Parameter":"Malaria P.f + P.v","Format":"Card","Specimen":"Serum, Plasma, Whole Blood","Pack Size":"1 x 40 Test Box","Storage":"4-30°C"},certifications:["CE IVD","WHO prequalified"],price:1800,stock:15,minOrderQty:1,tags:["malaria","P. falciparum","P. vivax","rapid test","perfebio"],isActive:true,isFeatured:false},
  {name:"Perfebio HCG Pregnancy Rapid Test Card",brand:"Perfebio",manufacturer:"Perfebio Technology (Beijing) Co. Ltd., China",category:"Laboratory Reagents",sku:"PFB-HCG-CARD-BPJ008",description:"Rapid qualitative HCG test for pregnancy detection. High sensitivity for early pregnancy confirmation.",specifications:{"Test Parameter":"HCG (Human Chorionic Gonadotropin)","Format":"Card","Specimen":"Serum, Plasma, Whole Blood","Sensitivity":"25 mIU/mL","Pack Size":"1 x 40 Test Box","Storage":"4-30°C"},certifications:["CE IVD"],price:100,stock:100,minOrderQty:1,tags:["HCG","pregnancy test","rapid test","perfebio"],isActive:true,isFeatured:true},
  {name:"Perfebio HCG Pregnancy Rapid Test Strip",brand:"Perfebio",manufacturer:"Perfebio Technology (Beijing) Co. Ltd., China",category:"Laboratory Reagents",sku:"PFB-HCG-STRIP-APJ008",description:"Economical urine pregnancy test strip. Most widely used pregnancy test format in Bangladesh clinics.",specifications:{"Test Parameter":"HCG","Format":"Strip","Specimen":"Urine","Sensitivity":"25 mIU/mL","Pack Size":"1 x 50 Test Box","Storage":"4-30°C"},certifications:["CE IVD"],price:100,stock:100,minOrderQty:1,tags:["HCG","pregnancy strip","urine test","perfebio"],isActive:true,isFeatured:true},
  {name:"Perfebio Typhoid IgG/IgM Rapid Test Card",brand:"Perfebio",manufacturer:"Perfebio Technology (Beijing) Co. Ltd., China",category:"Laboratory Reagents",sku:"PFB-TYPHOID-IGGIGM-CARD-BPJ015",description:"Rapid combo test for Typhoid IgG and IgM antibodies. Extremely relevant in Bangladesh — high typhoid prevalence.",specifications:{"Test Parameter":"Typhoid IgG + IgM","Format":"Card","Specimen":"Serum, Plasma, Whole Blood","Pack Size":"1 x 40 Test Box","Storage":"4-30°C"},certifications:["CE IVD"],price:2480,stock:20,minOrderQty:1,tags:["typhoid","IgG","IgM","Salmonella typhi","rapid test","perfebio"],isActive:true,isFeatured:true},
  {name:"Perfebio HEV IgG/IgM Rapid Test Card",brand:"Perfebio",manufacturer:"Perfebio Technology (Beijing) Co. Ltd., China",category:"Laboratory Reagents",sku:"PFB-HEV-IGGIGM-CARD-BPJ016",description:"Rapid test for Hepatitis E Virus (HEV) IgG and IgM antibodies.",specifications:{"Test Parameter":"HEV IgG + IgM","Format":"Card","Pack Size":"1 x 40 Test Box","Storage":"4-30°C"},certifications:["CE IVD"],price:3200,stock:12,minOrderQty:1,tags:["HEV","hepatitis E","IgG","IgM","rapid test","perfebio"],isActive:true,isFeatured:false},
  {name:"Perfebio Troponin I Rapid Test Card",brand:"Perfebio",manufacturer:"Perfebio Technology (Beijing) Co. Ltd., China",category:"Laboratory Reagents",sku:"PFB-TROP-I-CARD-BPJ017",description:"Rapid qualitative Troponin I test for heart attack (AMI) diagnosis at point of care.",specifications:{"Test Parameter":"Troponin I (cTnI)","Format":"Card","Specimen":"Serum, Plasma, Whole Blood","Pack Size":"1 x 40 Test Box","Storage":"4-30°C"},certifications:["CE IVD"],price:3200,stock:15,minOrderQty:1,tags:["troponin I","cardiac","AMI","heart attack","perfebio"],isActive:true,isFeatured:true},
  {name:"Perfebio Marijuana (THC) Rapid Test Card",brand:"Perfebio",manufacturer:"Perfebio Technology (Beijing) Co. Ltd., China",category:"Laboratory Reagents",sku:"PFB-THC-CARD-BPJ018",description:"Rapid urine drug screening test for Tetrahydrocannabinol (THC/Marijuana).",specifications:{"Test Parameter":"THC (Marijuana)","Format":"Card","Specimen":"Urine","Pack Size":"1 x 40 Test Box","Storage":"4-30°C"},certifications:["CE IVD"],price:1400,stock:10,minOrderQty:1,tags:["THC","marijuana","drug test","urine drug screen","perfebio"],isActive:true,isFeatured:false},
  {name:"Perfebio FOB (Fecal Occult Blood) Rapid Test Card",brand:"Perfebio",manufacturer:"Perfebio Technology (Beijing) Co. Ltd., China",category:"Laboratory Reagents",sku:"PFB-FOB-CARD-BPJ018",description:"Rapid fecal occult blood test for colorectal cancer screening and GI bleeding detection.",specifications:{"Test Parameter":"Fecal Occult Blood (FOB)","Format":"Card","Specimen":"Feces","Pack Size":"1 x 40 Test Box","Storage":"4-30°C"},certifications:["CE IVD"],price:1400,stock:15,minOrderQty:1,tags:["FOB","fecal occult blood","colorectal cancer","GI bleeding","perfebio"],isActive:true,isFeatured:false},
  {name:"Perfebio Amphetamine (AMP) Rapid Test Card",brand:"Perfebio",manufacturer:"Perfebio Technology (Beijing) Co. Ltd., China",category:"Laboratory Reagents",sku:"PFB-AMP-CARD-BPJ019",description:"Rapid urine drug test for Amphetamine detection.",specifications:{"Test Parameter":"Amphetamine (AMP)","Specimen":"Urine","Pack Size":"1 x 40 Test Box","Storage":"4-30°C"},certifications:["CE IVD"],price:1400,stock:10,minOrderQty:1,tags:["amphetamine","AMP","drug test","urine","perfebio"],isActive:true,isFeatured:false},
  {name:"Perfebio Alcohol Rapid Test Card",brand:"Perfebio",manufacturer:"Perfebio Technology (Beijing) Co. Ltd., China",category:"Laboratory Reagents",sku:"PFB-ALCOHOL-CARD-BPJ023",description:"Rapid test card for alcohol (ethanol) detection in urine.",specifications:{"Test Parameter":"Alcohol (Ethanol)","Specimen":"Urine","Pack Size":"1 x 40 Test Box","Storage":"4-30°C"},certifications:["CE IVD"],price:2800,stock:10,minOrderQty:1,tags:["alcohol","ethanol","drug test","urine","perfebio"],isActive:true,isFeatured:false},
  
  // Ozoclone - 1 product
  {name:"Ozoclone Blood Group Combo Reagent (ABO+D)",brand:"Ozoclone",manufacturer:"India",category:"Laboratory Reagents",sku:"OZO-BLOODGROUP-ABOD-10ML",description:"Blood grouping reagent combo for ABO and Rh(D) typing. IgG+IgM blend for accurate blood group determination. Essential for blood banks and transfusion services.",specifications:{"Test Parameter":"Blood Group A, B, D (ABO + Rh)","Kit Size":"10 mL x 3","Antibodies":"Anti-A (IgG+IgM), Anti-B (IgG+IgM), Anti-D (IgG+IgM)","Storage":"2-8°C","Origin":"India"},certifications:["CE IVD","CDSCO India"],price:600,stock:30,minOrderQty:1,tags:["blood group","ABO","Rh","blood typing","transfusion","ozoclone"],isActive:true,isFeatured:true},
  
  // GPL Barcelona - 10 products
  {name:"GPL Salmonella Typhi-O Antigen (Widal) 5ml",brand:"GPL",manufacturer:"GPL, Barcelona, Spain",category:"Laboratory Reagents",sku:"GPL-STYPHI-O-SE033-5ML",description:"Salmonella Typhi-O (somatic) antigen for Widal slide agglutination test. Typhoid fever diagnosis — one of the most commonly ordered tests in Bangladesh.",specifications:{"Test Parameter":"Salmonella Typhi-O","Test Type":"Widal Febrile Antigen","Kit Size":"5 mL","Tests Per Kit":"100","Method":"Slide agglutination","Storage":"2-8°C","Origin":"Spain"},certifications:["CE IVD","ISO 13485"],price:550,stock:40,minOrderQty:1,tags:["Salmonella Typhi-O","Widal test","typhoid","febrile antigen","GPL","Spain"],isActive:true,isFeatured:true},
  {name:"GPL Salmonella Typhi-H Antigen (Widal) 5ml",brand:"GPL",manufacturer:"GPL, Barcelona, Spain",category:"Laboratory Reagents",sku:"GPL-STYPHI-H-SE034-5ML",description:"Salmonella Typhi-H (flagellar) antigen for Widal test. Used alongside Typhi-O for complete typhoid diagnosis.",specifications:{"Test Parameter":"Salmonella Typhi-H","Kit Size":"5 mL","Tests Per Kit":"100","Storage":"2-8°C"},certifications:["CE IVD","ISO 13485"],price:550,stock:40,minOrderQty:1,tags:["Salmonella Typhi-H","Widal test","typhoid","GPL"],isActive:true,isFeatured:false},
  {name:"GPL Salmonella Para Typhi-AH Antigen 5ml",brand:"GPL",manufacturer:"GPL, Barcelona, Spain",category:"Laboratory Reagents",sku:"GPL-SPARATYPHI-AH-SE028-5ML",description:"Salmonella Para Typhi-AH antigen for paratyphoid fever diagnosis.",specifications:{"Test Parameter":"S. Para Typhi AH","Kit Size":"5 mL","Tests Per Kit":"100","Storage":"2-8°C"},certifications:["CE IVD"],price:550,stock:30,minOrderQty:1,tags:["Para Typhi AH","paratyphoid","Widal","GPL"],isActive:true,isFeatured:false},
  {name:"GPL Salmonella Para Typhi-BH Antigen 5ml",brand:"GPL",manufacturer:"GPL, Barcelona, Spain",category:"Laboratory Reagents",sku:"GPL-SPARATYPHI-BH-SE030-5ML",description:"Salmonella Para Typhi-BH antigen for paratyphoid B diagnosis.",specifications:{"Test Parameter":"S. Para Typhi BH","Kit Size":"5 mL","Tests Per Kit":"100","Storage":"2-8°C"},certifications:["CE IVD"],price:550,stock:30,minOrderQty:1,tags:["Para Typhi BH","paratyphoid","Widal","GPL"],isActive:true,isFeatured:false},
  {name:"GPL Proteus OX2 Antigen 5ml",brand:"GPL",manufacturer:"GPL, Barcelona, Spain",category:"Laboratory Reagents",sku:"GPL-PROTEUS-OX2-SE038-5ML",description:"Proteus OX2 antigen for Weil-Felix reaction in rickettsial disease diagnosis.",specifications:{"Test Parameter":"Proteus OX2","Kit Size":"5 mL","Tests Per Kit":"100","Storage":"2-8°C"},certifications:["CE IVD"],price:600,stock:20,minOrderQty:1,tags:["Proteus OX2","Weil-Felix","rickettsial","GPL"],isActive:true,isFeatured:false},
  {name:"GPL Brucella Abortus Antigen 5ml",brand:"GPL",manufacturer:"GPL, Barcelona, Spain",category:"Laboratory Reagents",sku:"GPL-BRUCELLA-AB-SE036-5ML",description:"Brucella abortus antigen for brucellosis screening by Rose Bengal test.",specifications:{"Test Parameter":"Brucella Abortus","Kit Size":"5 mL","Tests Per Kit":"100","Storage":"2-8°C"},certifications:["CE IVD"],price:600,stock:20,minOrderQty:1,tags:["Brucella","brucellosis","Rose Bengal","GPL"],isActive:true,isFeatured:false},
  {name:"GPL ASO Latex Reagent (with Control Slide) 100 Test",brand:"GPL",manufacturer:"GPL, Barcelona, Spain",category:"Laboratory Reagents",sku:"GPL-ASO-LATEX-SE002-100T",description:"Latex agglutination reagent for Anti-Streptolysin O (ASO) semi-quantitative detection. Includes control slide.",specifications:{"Test Parameter":"ASO (Anti-Streptolysin O)","Method":"Latex agglutination","Kit Size":"100 Tests","Includes":"Latex reagent + control slide","Storage":"2-8°C"},certifications:["CE IVD","ISO 13485"],price:2000,stock:20,minOrderQty:1,tags:["ASO","anti-streptolysin O","streptococcal","latex","GPL"],isActive:true,isFeatured:false},
  {name:"GPL CRP Latex Reagent (with Control Slide) 100 Test",brand:"GPL",manufacturer:"GPL, Barcelona, Spain",category:"Laboratory Reagents",sku:"GPL-CRP-LATEX-SE006-100T",description:"Latex agglutination for CRP semi-quantitative detection. Inflammation marker.",specifications:{"Test Parameter":"CRP","Kit Size":"100 Tests","Storage":"2-8°C"},certifications:["CE IVD"],price:800,stock:25,minOrderQty:1,tags:["CRP","C-reactive protein","inflammation","latex","GPL"],isActive:true,isFeatured:false},
  {name:"GPL RF Latex Reagent (with Control Slide) 100 Test",brand:"GPL",manufacturer:"GPL, Barcelona, Spain",category:"Laboratory Reagents",sku:"GPL-RF-LATEX-SE010-100T",description:"Latex agglutination for Rheumatoid Factor (RF) detection. Rheumatoid arthritis diagnosis.",specifications:{"Test Parameter":"RF (Rheumatoid Factor)","Kit Size":"100 Tests","Storage":"2-8°C"},certifications:["CE IVD"],price:1300,stock:20,minOrderQty:1,tags:["RF","rheumatoid factor","RA","arthritis","latex","GPL"],isActive:true,isFeatured:false},
  {name:"GPL HCG Latex Vial 100 Test",brand:"GPL",manufacturer:"GPL, Barcelona, Spain",category:"Laboratory Reagents",sku:"GPL-HCG-LATEX-SE018-100T",description:"Latex agglutination test for HCG (pregnancy) detection.",specifications:{"Test Parameter":"HCG","Kit Size":"100 Tests","Storage":"2-8°C"},certifications:["CE IVD"],price:2200,stock:20,minOrderQty:1,tags:["HCG","pregnancy","latex","GPL"],isActive:true,isFeatured:false},
  
  // Jumper - 7 products
  {name:"Jumper Pulse Oximeter JPD-500D",brand:"Jumper",manufacturer:"Jumper Medical Equipment Co. Ltd., China",category:"Diagnostic Equipment",sku:"JMP-PULSEOX-500D",description:"Fingertip pulse oximeter for SpO2 and pulse rate monitoring. Compact, portable, battery operated. 1 year warranty. Most popular oximeter in Bangladesh clinics.",specifications:{"Model":"500D","Parameters":"SpO2, Pulse Rate","SpO2 Range":"70-99%","Pulse Rate Range":"30-250 bpm","Accuracy":"SpO2 ±2%, PR ±2 bpm","Display":"OLED color display","Battery":"2x AAA","Battery Life":"30 hours","Weight":"50g (without batteries)","Warranty":"1 Year","Origin":"China"},certifications:["CE","FDA"],price:1200,stock:30,minOrderQty:1,tags:["pulse oximeter","SpO2","fingertip","jumper","JPD-500D"],isActive:true,isFeatured:true},
  {name:"Jumper Pulse Oximeter SPA30",brand:"Jumper",manufacturer:"Jumper Medical Equipment Co. Ltd., China",category:"Diagnostic Equipment",sku:"JMP-PULSEOX-SPA30",description:"Advanced fingertip pulse oximeter with larger display and better performance.",specifications:{"Model":"SPA30","Parameters":"SpO2, Pulse Rate, PI","Warranty":"1 Year","Origin":"China"},certifications:["CE","FDA"],price:1100,stock:25,minOrderQty:1,tags:["pulse oximeter","SpO2","jumper","SPA30"],isActive:true,isFeatured:false},
  {name:"Jumper Digital Blood Pressure Monitor HA300",brand:"Jumper",manufacturer:"Jumper Medical Equipment Co. Ltd., China",category:"Diagnostic Equipment",sku:"JMP-BP-MONITOR-HA300",description:"Automatic upper arm blood pressure monitor. Clinically validated. Large LCD display. 3 year warranty — best in class for home and clinic use.",specifications:{"Model":"HA300","Type":"Upper arm automatic","Measurement":"Systolic, Diastolic, Pulse Rate","Range":"0-300 mmHg","Accuracy":"±3 mmHg","Memory":"60 readings","Cuff Size":"22-42 cm (M-L)","Power":"4x AA batteries or AC adapter","Warranty":"3 Years","Origin":"China"},certifications:["CE","FDA"],price:1800,stock:25,minOrderQty:1,tags:["blood pressure monitor","BP monitor","jumper","HA300","automatic"],isActive:true,isFeatured:true},
  {name:"Jumper Infrared Thermometer FR300 (Dual Mode)",brand:"Jumper",manufacturer:"Jumper Medical Equipment Co. Ltd., China",category:"Diagnostic Equipment",sku:"JMP-INFRARED-THERM-FR300",description:"Non-contact dual-mode infrared thermometer. Measures forehead and object temperature. 1 second result. 1 year warranty.",specifications:{"Model":"FR300","Mode":"Forehead (body) + Object/Surface","Range":"32-43°C (body), 0-100°C (object)","Accuracy":"±0.2°C","Distance":"1-5 cm","Memory":"32 readings","Result Time":"1 second","Warranty":"1 Year","Origin":"China"},certifications:["CE","FDA"],price:1700,stock:20,minOrderQty:1,tags:["infrared thermometer","forehead thermometer","non-contact","jumper","FR300"],isActive:true,isFeatured:true},
  {name:"Jumper Fetal Doppler 100E",brand:"Jumper",manufacturer:"Jumper Medical Equipment Co. Ltd., China",category:"Diagnostic Equipment",sku:"JMP-FETAL-DOPPLER-100E",description:"Pocket fetal doppler for detecting fetal heartbeat from 12 weeks. Includes earphones and gel. 1 year warranty.",specifications:{"Model":"100E","Probe Frequency":"3 MHz","FHR Range":"50-240 bpm","Display":"LCD","Includes":"Earphone, ultrasound gel","Warranty":"1 Year","Origin":"China"},certifications:["CE","FDA"],price:4300,stock:10,minOrderQty:1,tags:["fetal doppler","fetal heart rate","pregnancy","jumper","100E"],isActive:true,isFeatured:true},
  {name:"Jumper Fetal Doppler SHA10",brand:"Jumper",manufacturer:"Jumper Medical Equipment Co. Ltd., China",category:"Diagnostic Equipment",sku:"JMP-FETAL-DOPPLER-SHA10",description:"Advanced fetal doppler with digital display and recording capability.",specifications:{"Model":"SHA10","Probe Frequency":"3 MHz","Warranty":"1 Year","Origin":"China"},certifications:["CE"],price:3800,stock:8,minOrderQty:1,tags:["fetal doppler","fetal heart rate","jumper","SHA10"],isActive:true,isFeatured:false},
  {name:"Jumper TENS Therapy Device ES230",brand:"Jumper",manufacturer:"Jumper Medical Equipment Co. Ltd., China",category:"Diagnostic Equipment",sku:"JMP-TENS-ES230",description:"TENS (Transcutaneous Electrical Nerve Stimulation) therapy device for pain relief. Multiple modes for different pain conditions. 1 year warranty.",specifications:{"Model":"ES230","Type":"TENS / EMS","Channels":"2","Modes":"Multiple preset modes","Intensity":"1-10 levels","Warranty":"1 Year","Origin":"China"},certifications:["CE"],price:2500,stock:10,minOrderQty:1,tags:["TENS","pain relief","physiotherapy","jumper","ES230"],isActive:true,isFeatured:false},
  
  // JEVE - 7 products
  {name:"JEVE Blood Glucose Meter",brand:"JEVE",manufacturer:"China",category:"Diagnostic Equipment",sku:"JEVE-BGM-600",description:"Affordable blood glucose meter for diabetes self-monitoring. Compact design for home and clinic use.",specifications:{"Measurement Range":"1.1-33.3 mmol/L","Sample Volume":"0.7 µL","Result Time":"5 seconds","Memory":"300 results","Origin":"China"},certifications:["CE"],price:600,stock:30,minOrderQty:1,tags:["blood glucose meter","glucometer","diabetes","JEVE"],isActive:true,isFeatured:true},
  {name:"JEVE Blood Glucose Test Strips (25 pcs)",brand:"JEVE",manufacturer:"China",category:"Laboratory Reagents",sku:"JEVE-BGS-25PCS",description:"Compatible glucose test strips for JEVE blood glucose meter. Pack of 25.",specifications:{"Compatibility":"JEVE Blood Glucose Meter","Pack Size":"25 strips","Storage":"Below 30°C, avoid humidity","Origin":"China"},certifications:["CE"],price:300,stock:100,minOrderQty:1,tags:["glucose strips","test strips","JEVE","glucometer"],isActive:true,isFeatured:false},
  {name:"JEVE Blood Glucose Test Strips (50 pcs)",brand:"JEVE",manufacturer:"China",category:"Laboratory Reagents",sku:"JEVE-BGS-50PCS",description:"Compatible glucose test strips for JEVE blood glucose meter. Economy pack of 50.",specifications:{"Compatibility":"JEVE Blood Glucose Meter","Pack Size":"50 strips","Origin":"China"},certifications:["CE"],price:500,stock:80,minOrderQty:1,tags:["glucose strips","test strips","JEVE","50 pack"],isActive:true,isFeatured:false},
  {name:"JEVE Digital Thermometer",brand:"JEVE",manufacturer:"China",category:"Diagnostic Equipment",sku:"JEVE-DTHERM-55",description:"Basic digital clinical thermometer for oral, axillary, or rectal use.",specifications:{"Range":"32-43°C","Accuracy":"±0.1°C","Result Time":"60 seconds","Battery":"1.5V button cell","Origin":"China"},certifications:["CE"],price:55,stock:100,minOrderQty:10,tags:["thermometer","digital thermometer","JEVE","clinical"],isActive:true,isFeatured:false},
  {name:"JEVE Digital Flexible Thermometer",brand:"JEVE",manufacturer:"China",category:"Diagnostic Equipment",sku:"JEVE-FLEX-THERM-90",description:"Flexible tip digital thermometer for comfortable use, especially for children.",specifications:{"Range":"32-43°C","Tip":"Flexible","Origin":"China"},certifications:["CE"],price:90,stock:50,minOrderQty:5,tags:["flexible thermometer","children thermometer","JEVE"],isActive:true,isFeatured:false},
  {name:"JEVE Oxygen Flow Meter YR-88",brand:"JEVE",manufacturer:"China",category:"Hospital Machines",sku:"JEVE-O2-FLOWMETER-YR88",description:"Oxygen flow meter for medical oxygen cylinders. Controls and measures O2 flow rate in L/min.",specifications:{"Model":"YR-88","Flow Range":"0-10 L/min","Connection":"Standard medical oxygen cylinder","Origin":"China"},certifications:["CE"],price:900,stock:20,minOrderQty:1,tags:["oxygen flow meter","O2","oxygen cylinder","JEVE","YR-88"],isActive:true,isFeatured:false},
  {name:"Hot Water Bag Electric",brand:"JEVE",manufacturer:"China",category:"Hospital Machines",sku:"JEVE-HWB-ELECTRIC-160",description:"Electric hot water bag for pain relief and warmth therapy.",specifications:{"Type":"Electric","Capacity":"Standard","Origin":"China"},certifications:["CE"],price:160,stock:20,minOrderQty:1,tags:["hot water bag","electric","pain relief","JEVE"],isActive:true,isFeatured:false},
  
  // Misc Brands - 10 products
  {name:"Mesh Nebulizer (China)",brand:"Generic",manufacturer:"China",category:"Hospital Machines",sku:"MESH-NEB-550",description:"Portable mesh nebulizer for respiratory medication delivery. Silent operation, USB chargeable.",specifications:{"Type":"Mesh nebulizer","Particle Size":"MMAD < 5 µm","Noise Level":"< 35 dB","Power":"USB/Battery","Origin":"China"},certifications:["CE"],price:550,stock:20,minOrderQty:1,tags:["nebulizer","mesh nebulizer","respiratory","asthma"],isActive:true,isFeatured:false},
  {name:"Advance Latex Examination Gloves Powder (100 pcs)",brand:"Advance",manufacturer:"Malaysia",category:"PPE & Safety",sku:"ADV-LATEX-EXAM-GLOVE-100",description:"Powdered latex examination gloves. Available in Small, Medium, Large. Malaysia origin — high quality.",specifications:{"Material":"Natural Latex","Powder":"Powdered","Sterile":"No (examination grade)","Pack Size":"100 pieces/box","Sizes":"S, M, L","Origin":"Malaysia"},certifications:["CE","ASTM D3578","EN 455"],price:370,stock:100,minOrderQty:1,tags:["latex gloves","examination gloves","PPE","Advance","Malaysia"],isActive:true,isFeatured:true},
  {name:"Accurate Dengue Test Kit (NS1 & IgG)",brand:"Accurate",manufacturer:"China",category:"Laboratory Reagents",sku:"ACC-DENGUE-NS1-IGG-35",description:"Dengue combo rapid test for NS1 antigen (early detection) and IgG antibody. Essential during Bangladesh dengue season.",specifications:{"Test Parameters":"Dengue NS1 + IgG","Pack Size":"Individual test","Origin":"China"},certifications:["CE IVD"],price:35,stock:200,minOrderQty:10,tags:["dengue","NS1","IgG","dengue test","Accurate"],isActive:true,isFeatured:true},
  {name:"IMDK Pulse Oximeter C101B1",brand:"IMDK",manufacturer:"China",category:"Diagnostic Equipment",sku:"IMDK-PULSEOX-C101B1",description:"Fingertip pulse oximeter for SpO2 and pulse rate monitoring.",specifications:{"Model":"C101B1","Brand":"IMDK","Parameters":"SpO2, Pulse Rate","Origin":"China"},certifications:["CE"],price:500,stock:20,minOrderQty:1,tags:["pulse oximeter","SpO2","IMDK","C101B1"],isActive:true,isFeatured:false},
  {name:"Alcohol Pad (Box)",brand:"Generic",manufacturer:"China",category:"PPE & Safety",sku:"ALCOHOL-PAD-BOX-48",description:"70% isopropyl alcohol prep pads for skin disinfection before injection or blood collection. 100 pads per box.",specifications:{"Type":"Alcohol prep pad (70% IPA)","Size":"Standard","Pack Size":"100 pads/box","Origin":"China"},certifications:["CE"],price:48,stock:200,minOrderQty:5,tags:["alcohol pad","prep pad","IPA","disinfection","injection"],isActive:true,isFeatured:false},
  {name:"Blood Lancet (Box)",brand:"Generic",manufacturer:"China",category:"PPE & Safety",sku:"BLOOD-LANCET-BOX-38",description:"Disposable sterile blood lancets for capillary blood collection. Used with glucometers.",specifications:{"Type":"Lancet","Gauge":"28G","Sterile":"Yes","Pack Size":"100 pcs/box","Origin":"China"},certifications:["CE"],price:38,stock:200,minOrderQty:5,tags:["lancet","blood lancet","glucose test","capillary blood"],isActive:true,isFeatured:false},
  {name:"Hot Water Bag Manual (Rubber)",brand:"Generic",manufacturer:"China",category:"Hospital Machines",sku:"HWB-MANUAL-RUBBER-130",description:"Traditional rubber hot water bottle for pain relief and warmth.",specifications:{"Type":"Manual rubber","Capacity":"1.5-2 Litre","Origin":"China"},certifications:["CE"],price:130,stock:30,minOrderQty:1,tags:["hot water bag","rubber","manual","pain relief"],isActive:true,isFeatured:false}
];

// Helper functions
async function findOrCreateManufacturer(brandName, country = '') {
  try {
    let manufacturer = await Manufacturer.findOne({ name: brandName });
    if (!manufacturer) {
      manufacturer = await Manufacturer.create({ name: brandName, country: country, isActive: true });
      logger.info(`✨ Created manufacturer: ${brandName}`);
    }
    return manufacturer;
  } catch (error) {
    logger.error(`Error finding/creating manufacturer ${brandName}: ${error.message}`);
    throw error;
  }
}

async function findOrCreateCategory(categoryName) {
  try {
    let category = await Category.findOne({ name: { $regex: new RegExp(`^${categoryName}$`, 'i') } });
    if (!category) {
      category = await Category.create({ name: categoryName, isActive: true, displayOrder: 0 });
      logger.info(`✨ Created category: ${categoryName}`);
    }
    return category;
  } catch (error) {
    logger.error(`Error finding/creating category ${categoryName}: ${error.message}`);
    throw error;
  }
}

async function productExists(sku) {
  try {
    const product = await Product.findOne({ sku: sku.toUpperCase() });
    return !!product;
  } catch (error) {
    logger.error(`Error checking product existence for SKU ${sku}: ${error.message}`);
    throw error;
  }
}

async function insertProduct(productData) {
  try {
    if (await productExists(productData.sku)) {
      return { status: 'skipped', sku: productData.sku, name: productData.name };
    }
    const manufacturer = await findOrCreateManufacturer(productData.brand, productData.manufacturer || '');
    const category = await findOrCreateCategory(productData.category);
    const productDoc = {
      sku: productData.sku.toUpperCase(),
      name: productData.name,
      description: productData.description,
      brand: manufacturer._id,
      category: category._id,
      price: productData.price,
      stock: productData.stock || 0,
      minOrderQty: productData.minOrderQty || 1,
      specifications: productData.specifications || {},
      certifications: productData.certifications || [],
      tags: productData.tags || [],
      isActive: productData.isActive !== undefined ? productData.isActive : true,
      isFeatured: productData.isFeatured || false,
      images: productData.images || []
    };
    const product = await Product.create(productDoc);
    return { status: 'added', sku: product.sku, name: product.name, id: product._id };
  } catch (error) {
    return { status: 'failed', sku: productData.sku, name: productData.name, error: error.message };
  }
}

async function seedProducts() {
  try {
    await mongoose.connect(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 5000, socketTimeoutMS: 45000 });
    logger.info('✓ Connected to MongoDB');
    logger.info(`\n🌱 Starting seed process for ${productsData.length} products...\n`);
    const results = { added: [], skipped: [], failed: [] };
    for (const productData of productsData) {
      const result = await insertProduct(productData);
      if (result.status === 'added') {
        results.added.push(result);
        console.log(`✅ Added: ${result.name} (${result.sku})`);
      } else if (result.status === 'skipped') {
        results.skipped.push(result);
        console.log(`⏭️  Skipped: ${result.name} (${result.sku}) - Already exists`);
      } else if (result.status === 'failed') {
        results.failed.push(result);
        console.log(`❌ Failed: ${result.name} (${result.sku}) - ${result.error}`);
      }
    }
    console.log('\n' + '═'.repeat(70));
    console.log('📊 SEED SUMMARY');
    console.log('═'.repeat(70));
    console.log(`✅ Added:   ${results.added.length}`);
    console.log(`⏭️  Skipped: ${results.skipped.length}`);
    console.log(`❌ Failed:  ${results.failed.length}`);
    console.log('═'.repeat(70) + '\n');
    if (results.failed.length > 0) {
      console.log('Failed products:');
      results.failed.forEach(item => console.log(`  - ${item.name} (${item.sku}): ${item.error}`));
      console.log('');
    }
    logger.info('✓ Seed process completed');
  } catch (error) {
    logger.error(`Seed process error: ${error.message}`);
    console.error(error);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    logger.info('✓ Database connection closed');
  }
}

if (require.main === module) {
  seedProducts().then(() => { console.log('✓ Script completed successfully'); process.exit(0); }).catch((error) => { console.error('✗ Script failed:', error); process.exit(1); });
}

module.exports = { seedProducts, insertProduct, findOrCreateManufacturer, findOrCreateCategory };
