# Shenzhen Litigation Expense Calculator

This context defines the domain language for estimating litigation-related costs for civil lawsuits filed in Shenzhen courts.

## Language

**First-Instance Civil Property Case**:
A civil lawsuit at first instance where the court fee is calculated from a monetary claim or property value.
_Avoid_: all civil cases, litigation case

**Claim Amount**:
The monetary amount or property value used as the base for fee calculations.
_Avoid_: case value, dispute amount

**Preservation Amount**:
The amount or property value requested in a property preservation application.
_Avoid_: claim amount when preservation is lower

**Attorney Fee Reference Estimate**:
A non-binding lawyer fee estimate based on the historical Guangdong government-guided fee bands.
_Avoid_: statutory attorney fee, mandatory lawyer fee

**Attorney Fee Reference Range**:
The low-to-high non-binding range for the attorney fee reference estimate.
_Avoid_: final lawyer quote, guaranteed fee range

**Court Acceptance Fee**:
The case acceptance fee payable to the court under the litigation fee rules.
_Avoid_: filing fee, lawsuit fee

**Preservation Application Fee**:
The fee payable when applying for property preservation.
_Avoid_: preservation insurance fee, preservation guarantee premium

**Preservation Insurance Fee Reference Estimate**:
A non-binding estimate of the premium charged by a third-party insurer or guarantee provider for litigation property preservation coverage.
_Avoid_: court preservation fee, statutory preservation fee

**Preservation Insurance Fee Reference Range**:
The low-to-high non-binding range for third-party preservation insurance or guarantee premiums.
_Avoid_: fixed insurance premium, court fee

## Relationships

- The first release covers only **First-Instance Civil Property Cases** filed in Shenzhen courts.
- A **Claim Amount** is the base input for the **Attorney Fee Reference Estimate** and **Court Acceptance Fee**.
- A **Preservation Amount** is the base input for the **Preservation Application Fee** and **Preservation Insurance Fee Reference Estimate**, and defaults to the **Claim Amount**.
- An **Attorney Fee Reference Estimate** is informational only because Shenzhen attorney service fees are currently market-regulated.
- An **Attorney Fee Reference Range** uses a low reference with the lower base fee and 80% of the proportional fee, a middle reference with the midpoint base fee and 100% of the proportional fee, and a high reference with the upper base fee and 120% of the proportional fee.
- A **Preservation Application Fee** is charged by the court, while a **Preservation Insurance Fee Reference Estimate** is charged by a third-party insurer or guarantee provider.
- A **Preservation Insurance Fee Reference Range** defaults to 0.1%, 0.3%, and 0.5% of the **Preservation Amount**, and the rate should remain editable.

## Example dialogue

> **Dev:** "Should the tool show lawyer fees as a fixed Shenzhen legal charge?"
> **Domain expert:** "No. Show an **Attorney Fee Reference Estimate** using the old Guangdong guided bands, and state that actual Shenzhen lawyer fees depend on the law firm's quote or engagement contract."
>
> **Dev:** "Does the first version include appeals, execution, and non-property cases?"
> **Domain expert:** "No. The first release is limited to **First-Instance Civil Property Cases**."
>
> **Dev:** "Should preservation use the same amount as the claim?"
> **Domain expert:** "Default the **Preservation Amount** to the **Claim Amount**, but allow users to change it."
>
> **Dev:** "Should lawyer fees be shown as one number?"
> **Domain expert:** "Show an **Attorney Fee Reference Range** and make the middle reference the primary number."
>
> **Dev:** "When we say preservation cost, do we mean the court fee or a third-party insurance premium?"
> **Domain expert:** "Show both separately: the court's **Preservation Application Fee** and the third-party **Preservation Insurance Fee Reference Estimate**."
>
> **Dev:** "What rate should we use for third-party preservation insurance?"
> **Domain expert:** "Default to a **Preservation Insurance Fee Reference Range** of 0.1% to 0.5%, use 0.3% as the middle reference, and let users edit the rate."

## Flagged ambiguities

- "律师费" can mean either an actual law firm quote or a reference estimate. Resolved: the tool uses **Attorney Fee Reference Estimate** and must label it as non-binding.
- "保全费" can mean the court's **Preservation Application Fee** or a third-party **Preservation Insurance Fee Reference Estimate**. Resolved: the tool shows them as separate line items.
