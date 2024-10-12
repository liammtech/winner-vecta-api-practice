# Winner <-> Vecta API Bridge

## Background

#### Within BA:
- The Design Team uses the Winner Flex platform to undertake kitchen design work
- The Commercial Team uses Vecta as a CRM for tracking leads/sales opportunities etc.

As of current, the design team must replicate any project data created in the Winner platform, manually within the Vecta platform.

## Project Brief Summary
This project is to develop a program/set of programs to bridge data between the Winner API and the Vecta API. Program will enable automatic transfer of certain data between BA's databases on either platform.

#### Benefits:
- Reduce administrative workload within the Design Team (manually replicating data from Winner within Vecta)
- Increase data integrity by reducing errors from such replication
- Commercial still have visibility of the Design Team's projects/leads
- Visibility may potentially be increased (for example, if any manual entries were previously missed)

## Process Flows
The API bridge will need to allow the transfer of data for design projects, either from Winner to Vecta, or case-depending, from Vecta to Winner. The data flow depends upon the route to market/customer type.

- Blossom Avenue/Retail =  <b>Winner -> Vecta</b>
- Kitchen Kit Merchants/Trade = <b>Winner -> Vecta</b>
- Kitchen Kit E-Commerse = <b>Vecta -> Winner -> Vecta</b>

![general process](flow-diagrams/project-creation-general-process.png "General Process")

![e-commerce process](flow-diagrams/project-creation-e-commerce.png "E-Commerce Process")
